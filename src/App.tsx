import { type PointerEvent, useMemo, useState } from 'react'
import {
  BookOpenText,
  Check,
  ChevronRight,
  Church,
  Clock3,
  Copy,
  CreditCard,
  HeartHandshake,
  Landmark,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  QrCode,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  SquarePlay,
} from 'lucide-react'
import './App.css'

type NoteKind = 'health' | 'repose' | 'single'
type PricingMode = 'perSheet' | 'perName'
type PaymentTab = 'robokassa' | 'qr' | 'bank'

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
const annunciationIcon = `${import.meta.env.BASE_URL}annunciation.png`

function formatRub(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽'
}

function parseAmount(value: string) {
  const numeric = Number(value.replace(/[^\d]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function countNames(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean).length
}

function calculateMinimum(service: Service, namesCount: number) {
  const safeCount = Math.max(namesCount, 1)

  if (service.pricing === 'perName') {
    return safeCount * service.price
  }

  return Math.ceil(safeCount / (service.sheetSize ?? 10)) * service.price
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
  const [paymentTab, setPaymentTab] = useState<PaymentTab>('robokassa')
  const [orderMessage, setOrderMessage] = useState('')

  const namesCount = useMemo(() => countNames(names), [names])
  const minimumAmount = useMemo(
    () => calculateMinimum(activeService, namesCount),
    [activeService, namesCount],
  )
  const enteredNoteAmount = parseAmount(noteAmount)
  const noteAmountTooLow = enteredNoteAmount > 0 && enteredNoteAmount < minimumAmount
  const selectedKind = activeService.kinds.includes(noteKind) ? noteKind : activeService.kinds[0]

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
    setOrderMessage('')
  }

  function handleNamesChange(value: string) {
    setNames(value)
    const nextCount = countNames(value)
    setNoteAmount(String(calculateMinimum(activeService, nextCount)))
  }

  function createDemoOrder(flow: 'note' | 'donation') {
    const number = Math.floor(100000 + Math.random() * 899999)
    const amount = flow === 'note' ? Math.max(enteredNoteAmount, minimumAmount) : parseAmount(donationAmount)
    const label = flow === 'note' ? 'записка' : 'пожертвование'
    setOrderMessage(
      `Тестовая заявка #${number}: ${label}, ${formatRub(amount)}. После подключения Robokassa здесь будет переход на реальную оплату.`,
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
                <small>На нужды храма</small>
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
            рассчитает минимальное пожертвование.
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

          <form className="note-form" onSubmit={(event) => event.preventDefault()}>
            <div className="form-row two">
              <label>
                Имя подающего
                <input
                  value={giverName}
                  onChange={(event) => setGiverName(event.target.value)}
                  placeholder="Например: Мария"
                />
              </label>
              <label>
                Контакт для связи
                <input
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="Телефон или email"
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

            <button
              className="primary-button"
              type="button"
              disabled={noteAmountTooLow || namesCount === 0}
              onClick={() => createDemoOrder('note')}
            >
              <CreditCard size={20} />
              Оплатить и подать записку
            </button>
          </form>
        </div>
      </section>

      <section id="donate" className="section donate-section" aria-labelledby="donate-title" data-reveal>
        <div className="section-heading">
          <h2 id="donate-title">Пожертвовать храму</h2>
          <p>
            Средства поступают на расчетный счет церкви. Основной путь - Robokassa,
            резервно доступны QR-код СБП и банковские реквизиты.
          </p>
        </div>

        <div className="donate-layout" data-reveal>
          <div className="donation-panel">
            <h3>Выберите сумму</h3>
            <div className="amount-grid">
              {donationPresets.map((amount) => (
                <button
                  className={parseAmount(donationAmount) === amount ? 'is-active' : ''}
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
              />
            </label>
            <button className="primary-button" type="button" onClick={() => createDemoOrder('donation')}>
              <HeartHandshake size={20} />
              Пожертвовать
            </button>
          </div>

          <div className="payment-panel">
            <div className="tabs" role="tablist" aria-label="Способы оплаты">
              <button
                className={paymentTab === 'robokassa' ? 'is-active' : ''}
                type="button"
                onClick={() => setPaymentTab('robokassa')}
              >
                <CreditCard size={18} />
                Robokassa
              </button>
              <button
                className={paymentTab === 'qr' ? 'is-active' : ''}
                type="button"
                onClick={() => setPaymentTab('qr')}
              >
                <QrCode size={18} />
                QR-код
              </button>
              <button
                className={paymentTab === 'bank' ? 'is-active' : ''}
                type="button"
                onClick={() => setPaymentTab('bank')}
              >
                <Landmark size={18} />
                Реквизиты
              </button>
            </div>

            {paymentTab === 'robokassa' ? (
              <div className="payment-copy">
                <ReceiptText size={28} />
                <h3>Автоматическое подтверждение оплаты</h3>
                <p>
                  После подключения Robokassa сайт будет создавать платеж, проверять подпись
                  ResultURL и передавать записку ответственным только после подтверждения.
                </p>
              </div>
            ) : null}

            {paymentTab === 'qr' ? (
              <div className="payment-copy">
                <div className="qr-mock">
                  <QrCode size={86} />
                </div>
                <h3>QR-код СБП</h3>
                <p>
                  Если пользователь оплачивает по QR-коду, заявка получает статус
                  "Ожидает проверки". Ответственный сверяет поступление вручную.
                </p>
                <a
                  className="secondary-button"
                  href="https://qr.nspk.ru/BS1A0047BC591PLI8SR9GDOSN5OGQ77S"
                  target="_blank"
                  rel="noreferrer"
                >
                  Открыть QR СБП
                </a>
              </div>
            ) : null}

            {paymentTab === 'bank' ? (
              <div className="payment-copy requisites">
                <Landmark size={28} />
                <h3>Банковские реквизиты</h3>
                <p>
                  Здесь будут полные реквизиты прихода: ИНН/КПП, расчетный счет, БИК,
                  банк и корреспондентский счет.
                </p>
                <button className="secondary-button" type="button">
                  <Copy size={18} />
                  Скопировать реквизиты
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {orderMessage ? (
          <div className="order-message" role="status">
            <ShieldCheck size={22} />
            {orderMessage}
          </div>
        ) : null}
      </section>

      <section className="section launch-section" aria-labelledby="launch-title" data-reveal>
        <div className="section-heading">
          <h2 id="launch-title">Что подключаем после домена</h2>
          <p>
            Эта версия уже готовит структуру под запуск: Robokassa, почта на домене,
            российский хостинг и служебный список заявок.
          </p>
        </div>
        <div className="launch-grid">
          <article>
            <CreditCard size={24} />
            <h3>Robokassa</h3>
            <p>MerchantLogin, пароли, ResultURL, SuccessURL и FailURL после модерации магазина.</p>
          </article>
          <article>
            <Mail size={24} />
            <h3>Почта</h3>
            <p>Адреса info@ и zapiski@ на домене, куда будут уходить подтвержденные записки.</p>
          </article>
          <article>
            <BookOpenText size={24} />
            <h3>Заявки</h3>
            <p>Номер, статус, сумма, способ оплаты, имена и дата обработки для ответственных.</p>
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
            Адрес будет указан после согласования
          </li>
          <li>
            <Phone size={20} />
            +7 (000) 000-00-00
          </li>
          <li>
            <Mail size={20} />
            zapiski@hram-example.ru
          </li>
          <li>
            <MessageCircle size={20} />
            MAX / VK после подключения
          </li>
          <li>
            <SquarePlay size={20} />
            Rutube
          </li>
        </ul>
      </footer>
    </main>
  )
}

export default App
