import { type FormEvent, type PointerEvent, useMemo, useState } from 'react'
import {
  Check,
  ChevronRight,
  Church,
  Clock3,
  ExternalLink,
  HeartHandshake,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  QrCode,
  ScrollText,
  Send,
  SquarePlay,
} from 'lucide-react'
import './App.css'

type NoteKind = 'health' | 'repose' | 'single'
type PricingMode = 'perSheet' | 'perName'
type SubmissionFlow = 'note' | 'donation'
type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'manual' | 'error'

type Service = {
  id: string
  title: string
  subtitle: string
  description: string
  notice?: string
  price: number
  pricing: PricingMode
  sheetSize?: number
  kinds: NoteKind[]
}

type SubmissionState = {
  status: SubmissionStatus
  title: string
  text: string
  flow?: SubmissionFlow
  orderId?: string
}

const services: Service[] = [
  {
    id: 'liturgy',
    title: 'Литургия',
    subtitle: 'до 10 имен в листке',
    description:
      'Литургия - главное богослужение Церкви. Во время Божественной литургии совершается особое поминовение живых и усопших православных христиан.',
    price: 350,
    pricing: 'perSheet',
    sheetSize: 10,
    kinds: ['health', 'repose'],
  },
  {
    id: 'thanksgiving',
    title: 'Благодарственный молебен',
    subtitle: 'до 10 имен в листке',
    description:
      'Благодарственный молебен - это молитва благодарения Богу за Его милость, помощь и благодеяния. В записке указывают имена тех, о ком будет вознесена благодарственная молитва.',
    notice: 'Молебен служится каждый воскресный день.',
    price: 300,
    pricing: 'perSheet',
    sheetSize: 10,
    kinds: ['single'],
  },
  {
    id: 'sorokoust',
    title: 'Сорокоуст',
    subtitle: '650 ₽ за 1 имя',
    description:
      'Сорокоуст - это поминовение человека в течение сорока дней. Его можно подать о здравии живого человека или об упокоении усопшего православного христианина.',
    price: 650,
    pricing: 'perName',
    kinds: ['health', 'repose'],
  },
  {
    id: 'panikhida',
    title: 'Панихида',
    subtitle: 'до 10 имен в листке',
    description:
      'Панихида - это заупокойное богослужение, на котором Церковь молится об усопших. В записке указывают имена усопших православных христиан в родительном падеже.',
    price: 300,
    pricing: 'perSheet',
    sheetSize: 10,
    kinds: ['single'],
  },
]

const kindLabels: Record<NoteKind, string> = {
  health: 'О здравии',
  repose: 'О упокоении',
  single: 'Записка',
}

const donationPresets = [100, 300, 500, 1000]
const sbpPaymentUrl = 'https://qr.nspk.ru/BS1A0047BC591PLI8SR9GDOSN5OGQ77S'
const notificationEndpoint = String(import.meta.env.VITE_ORDER_ENDPOINT ?? '').trim()
const annunciationIcon = `${import.meta.env.BASE_URL}annunciation.png`
const sbpQrImage = `${import.meta.env.BASE_URL}sbp-qr.svg`

const initialSubmission: SubmissionState = {
  status: 'idle',
  title: '',
  text: '',
}

function formatRub(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽'
}

function parseAmount(value: string) {
  const numeric = Number(value.replace(/[^\d]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function countNames(value: string) {
  return normalizeNames(value).length
}

function normalizeNames(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function calculateMinimum(service: Service, namesCount: number) {
  const safeCount = Math.max(namesCount, 1)

  if (service.pricing === 'perName') {
    return safeCount * service.price
  }

  return Math.ceil(safeCount / (service.sheetSize ?? 10)) * service.price
}

function makeOrderId(prefix: 'Z' | 'D') {
  const now = new Date()
  const date = now.toISOString().slice(2, 10).replaceAll('-', '')
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${date}-${random}`
}

async function postOrder(payload: Record<string, unknown>) {
  if (!notificationEndpoint) {
    return { delivered: false }
  }

  const response = await fetch(notificationEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Notification endpoint failed with ${response.status}`)
  }

  return response.json().catch(() => ({ delivered: true }))
}

function App() {
  const [activeServiceId, setActiveServiceId] = useState(services[0].id)
  const activeService = services.find((service) => service.id === activeServiceId) ?? services[0]
  const [noteKind, setNoteKind] = useState<NoteKind>('health')
  const [names, setNames] = useState('')
  const [giverName, setGiverName] = useState('')
  const [contact, setContact] = useState('')
  const [noteAmount, setNoteAmount] = useState(String(activeService.price))
  const [donationAmount, setDonationAmount] = useState('500')
  const [donorName, setDonorName] = useState('')
  const [notePrivacyAccepted, setNotePrivacyAccepted] = useState(false)
  const [donationPrivacyAccepted, setDonationPrivacyAccepted] = useState(false)
  const [website, setWebsite] = useState('')
  const [submission, setSubmission] = useState<SubmissionState>(initialSubmission)

  const namesCount = useMemo(() => countNames(names), [names])
  const namesList = useMemo(() => normalizeNames(names), [names])
  const minimumAmount = useMemo(
    () => calculateMinimum(activeService, namesCount),
    [activeService, namesCount],
  )
  const enteredNoteAmount = parseAmount(noteAmount)
  const finalNoteAmount = Math.max(enteredNoteAmount, minimumAmount)
  const noteAmountTooLow = enteredNoteAmount < minimumAmount
  const selectedKind = activeService.kinds.includes(noteKind) ? noteKind : activeService.kinds[0]
  const donationValue = parseAmount(donationAmount)
  const isSubmitting = submission.status === 'submitting'
  const canSubmitNote =
    namesCount > 0 &&
    giverName.trim().length > 0 &&
    notePrivacyAccepted &&
    !noteAmountTooLow &&
    !isSubmitting
  const canSubmitDonation = donationValue > 0 && donationPrivacyAccepted && !isSubmitting

  function moveHeroLight(event: PointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100

    event.currentTarget.style.setProperty('--hero-x', `${x}%`)
    event.currentTarget.style.setProperty('--hero-y', `${y}%`)
  }

  function selectService(service: Service) {
    setActiveServiceId(service.id)
    setNoteKind(service.kinds[0])
    setNoteAmount(String(calculateMinimum(service, namesCount)))
    setSubmission(initialSubmission)
  }

  function handleNamesChange(value: string) {
    setNames(value)
    const nextCount = countNames(value)
    setNoteAmount(String(calculateMinimum(activeService, nextCount)))
    setSubmission(initialSubmission)
  }

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmitNote) {
      return
    }

    const orderId = makeOrderId('Z')
    setSubmission({
      status: 'submitting',
      title: 'Отправляем записку',
      text: 'Сейчас заявка передается ответственным.',
      flow: 'note',
      orderId,
    })

    const payload = {
      orderId,
      flow: 'note',
      status: 'waiting_payment',
      createdAt: new Date().toISOString(),
      sourceUrl: window.location.href,
      paymentUrl: sbpPaymentUrl,
      serviceId: activeService.id,
      serviceTitle: activeService.title,
      noteKind: kindLabels[selectedKind],
      giverName: giverName.trim(),
      contact: contact.trim(),
      names: namesList,
      namesCount,
      minimumAmount,
      amount: finalNoteAmount,
      website,
    }

    try {
      await postOrder(payload)

      setSubmission({
        status: notificationEndpoint ? 'success' : 'manual',
        title: notificationEndpoint ? 'Записка отправлена' : 'Заявка сформирована',
        text: notificationEndpoint
          ? 'Теперь оплатите ее через СБП. После ручной сверки поступления записку передадут в храм.'
          : 'Уведомления еще не подключены на предпросмотре. Перед боевым запуском включим отправку на почту, в Telegram и VK.',
        flow: 'note',
        orderId,
      })
    } catch {
      setSubmission({
        status: 'error',
        title: 'Не удалось отправить записку',
        text: 'Проверьте соединение и попробуйте еще раз. Оплату лучше делать после успешной отправки заявки.',
        flow: 'note',
        orderId,
      })
    }
  }

  async function submitDonation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmitDonation) {
      return
    }

    const orderId = makeOrderId('D')
    setSubmission({
      status: 'submitting',
      title: 'Готовим пожертвование',
      text: 'Сейчас сформируем короткое уведомление для ответственных.',
      flow: 'donation',
      orderId,
    })

    const payload = {
      orderId,
      flow: 'donation',
      status: 'waiting_payment',
      createdAt: new Date().toISOString(),
      sourceUrl: window.location.href,
      paymentUrl: sbpPaymentUrl,
      donorName: donorName.trim(),
      amount: donationValue,
      website,
    }

    try {
      await postOrder(payload)

      setSubmission({
        status: notificationEndpoint ? 'success' : 'manual',
        title: notificationEndpoint ? 'Пожертвование сформировано' : 'Переход к оплате',
        text: notificationEndpoint
          ? 'Откройте оплату по СБП. Если банк предложит комментарий, можно указать номер заявки.'
          : 'На предпросмотре можно открыть СБП-ссылку вручную. Уведомления подключим перед запуском.',
        flow: 'donation',
        orderId,
      })
    } catch {
      setSubmission({
        status: 'error',
        title: 'Не удалось сформировать уведомление',
        text: 'Проверьте соединение и попробуйте еще раз. СБП-ссылка остается доступной ниже.',
        flow: 'donation',
        orderId,
      })
    }
  }

  function renderSubmissionMessage(flow: SubmissionFlow) {
    if (submission.status === 'idle' || submission.flow !== flow) {
      return null
    }

    return (
      <div className={`order-message ${submission.status}`} role="status">
        <Check size={22} />
        <div>
          <strong>{submission.title}</strong>
          {submission.orderId ? <span>Номер: {submission.orderId}</span> : null}
          <p>{submission.text}</p>
        </div>
        {submission.status !== 'submitting' && submission.status !== 'error' ? (
          <a className="secondary-button" href={sbpPaymentUrl} target="_blank" rel="noreferrer">
            Оплатить по СБП
            <ExternalLink size={16} />
          </a>
        ) : null}
      </div>
    )
  }

  return (
    <main className="site-shell">
      <header className="hero-header" onPointerMove={moveHeroLight}>
        <nav className="topbar" aria-label="Основная навигация">
          <a className="brand-mini" href="#top" aria-label="На главную">
            <Church size={22} />
            <span>Благовещение</span>
          </a>
          <div className="desktop-nav">
            <a href="#notes">Подать записку</a>
            <a href="#donate">Пожертвовать</a>
            <a href="#contacts">Контакты</a>
          </div>
          <button className="icon-button" type="button" aria-label="Открыть меню">
            <Menu size={22} />
          </button>
        </nav>

        <section id="top" className="hero-grid">
          <div className="icon-frame">
            <img src={annunciationIcon} alt="Икона Благовещения Пресвятой Богородицы" />
          </div>

          <div className="hero-title">
            <div className="cross">☦</div>
            <h1>Храм Благовещения Пресвятой Богородицы</h1>
            <p>в Горловке</p>
            <span className="ornament-line" aria-hidden="true" />
          </div>

          <div className="hero-actions" aria-label="Главные действия">
            <a className="action action-primary" href="#notes">
              <ScrollText size={30} />
              <span>
                <strong>Подать записку</strong>
                <small>О здравии и об упокоении</small>
              </span>
              <ChevronRight size={20} />
            </a>
            <a className="action action-light" href="#donate">
              <HeartHandshake size={30} />
              <span>
                <strong>Пожертвовать</strong>
                <small>Оплата по QR СБП</small>
              </span>
              <ChevronRight size={20} />
            </a>
          </div>
        </section>
      </header>

      <section className="rules-band" aria-labelledby="rules-title" data-reveal>
        <div>
          <h2 id="rules-title">Как правильно подать записку</h2>
          <p>
            В записках указываются имена людей, крещенных в Православной Церкви. Имена
            пишутся в родительном падеже: Иоанна, Марии, Николая, Елены.
          </p>
        </div>
        <ul>
          <li>
            <Check size={18} />
            Только церковные имена
          </li>
          <li>
            <Check size={18} />
            Без фамилий и отчеств
          </li>
          <li>
            <Check size={18} />
            Каждое имя с новой строки
          </li>
        </ul>
      </section>

      <section id="notes" className="section notes-section" aria-labelledby="notes-title" data-reveal>
        <div className="section-heading">
          <h2 id="notes-title">Подать записку</h2>
          <p>
            Выберите вид поминовения, укажите имена в родительном падеже, а сайт сам
            рассчитает минимальное пожертвование. Оплата сейчас проходит по QR СБП.
          </p>
        </div>

        <div className="service-grid">
          {services.map((service) => (
            <button
              className={`service-card ${service.id === activeService.id ? 'is-active' : ''}`}
              key={service.id}
              type="button"
              onClick={() => selectService(service)}
              data-reveal
            >
              <Church size={30} />
              <strong>{service.title}</strong>
              <span>{service.subtitle}</span>
              <b>{service.pricing === 'perName' ? '650 ₽ / имя' : `от ${formatRub(service.price)}`}</b>
              <ChevronRight className="card-arrow" size={18} />
            </button>
          ))}
        </div>

        <div className="workbench" data-reveal>
          <aside className="note-preview" aria-label="Вид записки">
            <h3>{activeService.title}</h3>
            <p>{activeService.description}</p>
            {activeService.notice ? (
              <div className="service-notice">
                <Clock3 size={18} />
                {activeService.notice}
              </div>
            ) : null}

            <div className={`paper-switcher ${activeService.kinds.length === 1 ? 'single' : ''}`}>
              {activeService.kinds.map((kind) => (
                <button
                  className={`paper-sheet ${kind === selectedKind ? 'is-selected' : ''} ${kind}`}
                  key={kind}
                  type="button"
                  onClick={() => setNoteKind(kind)}
                >
                  <span>{kindLabels[kind]}</span>
                  <i aria-hidden="true" />
                </button>
              ))}
            </div>
          </aside>

          <form className="note-form" onSubmit={submitNote}>
            <div className="form-row two">
              <label>
                Имя подающего
                <input
                  value={giverName}
                  onChange={(event) => setGiverName(event.target.value)}
                  placeholder="Например: Мария"
                  autoComplete="name"
                  required
                />
              </label>
              <label>
                Контакт для связи
                <input
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="Телефон, email или мессенджер"
                  autoComplete="tel"
                />
              </label>
            </div>

            <label>
              Имена для записки
              <textarea
                value={names}
                onChange={(event) => handleNamesChange(event.target.value)}
                placeholder={'Иоанна\nМарии\nНиколая'}
                rows={8}
                required
              />
            </label>

            <div className="hint-box">
              Имена указывайте в родительном падеже, каждое с новой строки. Пишите
              церковные имена без фамилий и отчеств.
            </div>

            <div className="summary-line">
              <span>Всего имен</span>
              <strong>{namesCount}</strong>
            </div>
            <div className="summary-line">
              <span>Минимальное пожертвование</span>
              <strong>{formatRub(minimumAmount)}</strong>
            </div>

            <label>
              Ваша сумма
              <input
                inputMode="numeric"
                value={noteAmount}
                onChange={(event) => setNoteAmount(event.target.value)}
                required
              />
            </label>
            {noteAmountTooLow ? (
              <p className="error-text">
                Минимальная сумма для выбранной записки: {formatRub(minimumAmount)}. Можно
                указать больше, но не меньше.
              </p>
            ) : (
              <p className="soft-text">Вы можете пожертвовать большую сумму по своему желанию.</p>
            )}

            <label className="consent-line">
              <input
                checked={notePrivacyAccepted}
                onChange={(event) => setNotePrivacyAccepted(event.target.checked)}
                type="checkbox"
                required
              />
              <span>
                Согласен на обработку указанных данных для передачи записки ответственным храма.
              </span>
            </label>

            <label className="hidden-field" aria-hidden="true">
              Сайт
              <input
                autoComplete="off"
                tabIndex={-1}
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </label>

            <button className="primary-button" type="submit" disabled={!canSubmitNote}>
              <Send size={20} />
              {isSubmitting ? 'Отправляем...' : 'Отправить записку'}
            </button>
          </form>
        </div>

        {renderSubmissionMessage('note')}
      </section>

      <section id="donate" className="section donate-section" aria-labelledby="donate-title" data-reveal>
        <div className="section-heading">
          <h2 id="donate-title">Пожертвовать храму</h2>
          <p>
            Пожертвование можно внести по QR СБП. Если вы подаете записку, оплачивайте сумму
            не ниже рассчитанной сайтом.
          </p>
        </div>

        <div className="donate-layout" data-reveal>
          <form className="donation-panel" onSubmit={submitDonation}>
            <h3>Выберите сумму</h3>
            <div className="amount-grid">
              {donationPresets.map((amount) => (
                <button
                  className={donationValue === amount ? 'is-active' : ''}
                  key={amount}
                  type="button"
                  onClick={() => setDonationAmount(String(amount))}
                >
                  {formatRub(amount)}
                </button>
              ))}
            </div>
            <label>
              Другая сумма
              <input
                inputMode="numeric"
                value={donationAmount}
                onChange={(event) => setDonationAmount(event.target.value)}
                required
              />
            </label>
            <label>
              Ваше имя
              <input
                value={donorName}
                onChange={(event) => setDonorName(event.target.value)}
                placeholder="Можно не указывать"
                autoComplete="name"
              />
            </label>
            <label className="consent-line">
              <input
                checked={donationPrivacyAccepted}
                onChange={(event) => setDonationPrivacyAccepted(event.target.checked)}
                type="checkbox"
                required
              />
              <span>Согласен на обработку данных для оформления пожертвования.</span>
            </label>
            <button className="primary-button" type="submit" disabled={!canSubmitDonation}>
              <HeartHandshake size={20} />
              Пожертвовать
            </button>
          </form>

          <div className="payment-panel sbp-panel">
            <div className="payment-copy">
              <div className="qr-card">
                <img src={sbpQrImage} alt="QR-код для оплаты через СБП" />
              </div>
              <h3>Оплата по QR СБП</h3>
              <p>
                Откройте ссылку или отсканируйте QR-код в приложении банка. После оплаты
                ответственным нужно сверить поступление вручную.
              </p>
              <a className="secondary-button" href={sbpPaymentUrl} target="_blank" rel="noreferrer">
                <QrCode size={18} />
                Открыть оплату СБП
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>

        {renderSubmissionMessage('donation')}
      </section>

      <section className="section process-section" aria-labelledby="process-title" data-reveal>
        <div className="section-heading">
          <h2 id="process-title">Порядок обработки</h2>
          <p>
            Сейчас платеж по СБП проверяется вручную. Заявка получает номер, а после сверки
            поступления передается ответственным для поминовения.
          </p>
        </div>
        <div className="launch-grid process-grid">
          <article>
            <ScrollText size={24} />
            <h3>1. Записка</h3>
            <p>Вы заполняете имена, сайт рассчитывает минимальное пожертвование и формирует номер.</p>
          </article>
          <article>
            <QrCode size={24} />
            <h3>2. Оплата</h3>
            <p>Оплата проходит по QR СБП. Сумму можно увеличить по своему желанию.</p>
          </article>
          <article>
            <Mail size={24} />
            <h3>3. Передача</h3>
            <p>
              {notificationEndpoint
                ? 'Заявка уходит ответственным на почту, в Telegram и VK.'
                : 'Перед запуском подключим уведомления для почты, Telegram и VK.'}
            </p>
          </article>
        </div>
      </section>

      <footer id="contacts" className="footer" data-reveal>
        <div>
          <h2>Контакты</h2>
          <p>Храм Благовещения Пресвятой Богородицы в Горловке</p>
        </div>
        <ul>
          <li>
            <MapPin size={20} />
            г. Горловка
          </li>
          <li>
            <Phone size={20} />
            Телефон будет добавлен после согласования
          </li>
          <li>
            <Mail size={20} />
            Почта для записок подключается
          </li>
          <li>
            <MessageCircle size={20} />
            Telegram / VK для уведомлений
          </li>
          <li>
            <SquarePlay size={20} />
            Rutube после согласования
          </li>
        </ul>
      </footer>
    </main>
  )
}

export default App
