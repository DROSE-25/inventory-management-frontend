import { useState } from 'react';
import {
  BookOpen, Package, ShoppingCart, Truck, Warehouse,
  BarChart3, FileText, Users, ChevronDown, ChevronRight,
  Lightbulb, AlertTriangle, CheckCircle2, ArrowRight,
} from 'lucide-react';

const SECTIONS = [
  {
    id: 'intro',
    icon: BookOpen,
    title: 'Що таке ця система?',
    color: '#5A68C0',
    bg: '#FFF1F5',
    content: [
      {
        type: 'text',
        value: 'Система управління запасами – це інструмент для малого та середнього бізнесу, який допомагає контролювати товари на складі, відстежувати продажі, прогнозувати попит та своєчасно робити замовлення постачальникам.',
      },
      {
        type: 'tip',
        value: 'Система підходить для магазинів, кафе, виробництв, аптек – будь-якого бізнесу де є товари та склад.',
      },
      {
        type: 'steps',
        title: 'З чого почати:',
        items: [
          'Додати постачальників (від кого купуєте товари)',
          'Додати товари до каталогу',
          'Перевірити склад – він вже створений за замовчуванням',
          'Реєструвати продажі щодня',
          'Переглядати аналітику і прогнози',
        ],
      },
    ],
  },
  {
    id: 'roles',
    icon: Users,
    title: 'Ролі користувачів',
    color: '#DC2626',
    bg: '#FEF2F2',
    content: [
      {
        type: 'roles',
        items: [
          {
            role: 'Адмін',
            color: '#DC2626',
            desc: 'Повний доступ до всього. Може додавати користувачів, видаляти товари, керувати системою.',
            can: ['Все що можуть менеджер і аналітик', 'Додавати/видаляти користувачів', 'Видаляти товари і постачальників'],
          },
          {
            role: 'Менеджер',
            color: '#5A68C0',
            desc: 'Робочий користувач. Реєструє продажі, додає товари і постачальників.',
            can: ['Додавати товари, постачальники, склади', 'Реєструвати продажі', 'Переглядати всі дані'],
          },
          {
            role: 'Аналітик',
            color: '#059669',
            desc: 'Тільки перегляд. Може дивитися дані, прогнози і звіти, але не змінювати.',
            can: ['Переглядати товари, продажі, склади', 'Запускати прогнози', 'Завантажувати звіти'],
          },
        ],
      },
    ],
  },
  {
    id: 'products',
    icon: Package,
    title: 'Товари – каталог',
    color: '#5A68C0',
    bg: '#FFF1F5',
    content: [
      {
        type: 'text',
        value: 'Каталог товарів – це список всього що ви продаєте або зберігаєте. Кожен товар має свій SKU (унікальний код), ціну і постачальника.',
      },
      {
        type: 'steps',
        title: 'Як додати товар:',
        items: [
          'Перейдіть у розділ "Товари"',
          'Натисніть "Додати товар" (тільки Адмін і Менеджер)',
          'Заповніть назву, SKU (наприклад MILK-001), ціну',
          'Оберіть категорію і постачальника',
          'Натисніть "Створити"',
        ],
      },
      {
        type: 'tip',
        value: 'SKU – це ваш внутрішній код товару. Придумайте зручну систему: перші літери назви + номер. Наприклад: MILK-001, BRD-002.',
      },
      {
        type: 'warning',
        value: 'Спочатку додайте постачальників – без них не можна створити товар.',
      },
    ],
  },
  {
    id: 'suppliers',
    icon: Truck,
    title: 'Постачальники',
    color: '#7C3AED',
    bg: '#F5F3FF',
    content: [
      {
        type: 'text',
        value: 'Постачальники – це компанії або люди від яких ви купуєте товари. Система зберігає їх контакти і термін доставки.',
      },
      {
        type: 'steps',
        title: 'Як додати постачальника:',
        items: [
          'Перейдіть у розділ "Постачальники"',
          'Натисніть "Додати постачальника"',
          'Введіть назву компанії, email, телефон',
          'Вкажіть термін доставки (скільки днів чекати замовлення)',
          'Натисніть "Створити"',
        ],
      },
      {
        type: 'tip',
        value: 'Термін доставки важливий – система використовує його для розрахунку коли треба робити замовлення (ROP).',
      },
    ],
  },
  {
    id: 'warehouses',
    icon: Warehouse,
    title: 'Склади',
    color: '#0891B2',
    bg: '#F0F9FF',
    content: [
      {
        type: 'text',
        value: 'Склад – це місце де зберігаються товари. За замовчуванням в системі є один "Головний склад". Якщо у вас кілька торгових точок або складів – додайте їх.',
      },
      {
        type: 'steps',
        title: 'Як додати склад:',
        items: [
          'Перейдіть у розділ "Склади"',
          'Натисніть "Додати склад"',
          'Введіть назву і адресу',
          'Вкажіть місткість (скільки одиниць товару вміщує)',
        ],
      },
      {
        type: 'tip',
        value: 'Для більшості малих підприємств достатньо одного складу. Декілька складів потрібні якщо у вас різні точки продажу.',
      },
    ],
  },
  {
    id: 'sales',
    icon: ShoppingCart,
    title: 'Продажі – реєстрація',
    color: '#059669',
    bg: '#F0FDF4',
    content: [
      {
        type: 'text',
        value: 'Реєстрація продажів – найважливіша щоденна дія. Без цих даних система не зможе будувати прогнози і показувати аналітику.',
      },
      {
        type: 'steps',
        title: 'Як зареєструвати продаж:',
        items: [
          'Перейдіть у розділ "Продажі"',
          'Натисніть "Зареєструвати продаж"',
          'Оберіть товар – ціна підставиться автоматично',
          'Оберіть склад з якого списується товар',
          'Вкажіть кількість і дату',
          'Натисніть "Зареєструвати" – залишок на складі зменшиться автоматично',
        ],
      },
      {
        type: 'warning',
        value: 'Якщо на складі недостатньо товару – система покаже помилку. Спочатку поповніть залишки.',
      },
      {
        type: 'tip',
        value: 'Реєструйте продажі щодня або хоча б раз на тиждень – чим більше даних, тим точніші прогнози.',
      },
    ],
  },
  {
    id: 'forecasts',
    icon: BarChart3,
    title: 'Прогнози попиту',
    color: '#7C3AED',
    bg: '#F5F3FF',
    content: [
      {
        type: 'text',
        value: 'Прогнозування – це розрахунок скільки товару ви продасте в наступні 30 днів. Система порівнює 6 математичних методів і обирає найточніший для кожного товару.',
      },
      {
        type: 'steps',
        title: 'Як переглянути прогноз:',
        items: [
          'Перейдіть у розділ "Прогнози"',
          'Оберіть товар зі списку',
          'Натисніть "Порівняти методи"',
          'Система покаже таблицю з 6 методами і їх точністю (MAPE)',
          'Найкращий метод буде позначений як BEST',
        ],
      },
      {
        type: 'info',
        title: 'Що означають скорочення:',
        items: [
          'MAPE – середня відсоткова помилка. Чим менше – тим точніше. До 10% – відмінно.',
          'MAE – середня абсолютна помилка в одиницях товару.',
          'SMA – просте ковзне середнє. Добре для стабільного попиту.',
          'Holt – метод для товарів з трендом (зростання або спад).',
          'Naive – найпростіший метод. Зазвичай програє іншим.',
        ],
      },
      {
        type: 'warning',
        value: 'Для прогнозу потрібно мінімум 2-3 записи продажів по товару. Чим більше – тим краще.',
      },
    ],
  },
  {
    id: 'reorder',
    icon: AlertTriangle,
    title: 'Критичні залишки і ROP',
    color: '#EA580C',
    bg: '#FFF7ED',
    content: [
      {
        type: 'text',
        value: 'ROP (Reorder Point) – це точка перезамовлення. Коли залишок товару падає нижче цього рівня – пора робити замовлення постачальнику.',
      },
      {
        type: 'info',
        title: 'Що показує Dashboard:',
        items: [
          '"Нижче точки ROP" – скільки товарів потребують замовлення прямо зараз',
          '"Критичні залишки" – таблиця з конкретними товарами і рекомендаціями',
          'EOQ – оптимальна кількість для замовлення (економічно вигідна партія)',
        ],
      },
      {
        type: 'steps',
        title: 'Як діяти коли є критичні залишки:',
        items: [
          'Відкрийте Dashboard – перевірте таблицю "Критичні залишки"',
          'Знайдіть товар з позначкою "КРИТИЧНО" або "ЗАМОВИТИ"',
          'Зверніть увагу на колонку EOQ – це рекомендована кількість замовлення',
          'Зв\'яжіться з постачальником і зробіть замовлення',
          'Після надходження товару – поновіть залишок на складі',
        ],
      },
      {
        type: 'tip',
        value: 'Перевіряйте Dashboard щоранку – 1 хвилина, щоб не залишитись без товару.',
      },
    ],
  },
  {
    id: 'abc',
    icon: BarChart3,
    title: 'ABC/XYZ аналіз',
    color: '#059669',
    bg: '#F0FDF4',
    content: [
      {
        type: 'text',
        value: 'ABC/XYZ аналіз допомагає зрозуміти які товари найважливіші для вашого бізнесу і як стабільний на них попит.',
      },
      {
        type: 'info',
        title: 'ABC – за оборотом (виручкою):',
        items: [
          'Клас A – 20% товарів, але 80% виручки. Найважливіші. Тримайте завжди в наявності.',
          'Клас B – середня важливість. Стандартний контроль.',
          'Клас C – низька виручка. Можна замовляти рідше або зменшити запаси.',
        ],
      },
      {
        type: 'info',
        title: 'XYZ – за стабільністю попиту:',
        items: [
          'Клас X – стабільний попит. Легко прогнозувати.',
          'Клас Y – помірні коливання. Враховуйте сезонність.',
          'Клас Z – непередбачуваний попит. Замовляти під конкретну потребу.',
        ],
      },
      {
        type: 'tip',
        value: 'Товари AX – ваші головні. Ніколи не допускайте щоб вони закінчились. Товари CZ – розгляньте чи взагалі варто їх тримати.',
      },
    ],
  },
  {
    id: 'reports',
    icon: FileText,
    title: 'Звіти',
    color: '#0891B2',
    bg: '#F0F9FF',
    content: [
      {
        type: 'text',
        value: 'Звіти дозволяють вивантажити дані з системи у файли для подальшої обробки в Excel або передачі бухгалтеру.',
      },
      {
        type: 'info',
        title: 'Доступні звіти:',
        items: [
          'ABC/XYZ Аналіз – класифікація всіх товарів. Формати: CSV, Excel, PDF.',
          'Критичні залишки – товари нижче ROP з рекомендаціями. Формат: CSV.',
          'Каталог товарів – повний список з цінами і постачальниками. Формат: CSV.',
        ],
      },
      {
        type: 'tip',
        value: 'PDF зручний для друку і презентацій. Excel – для подальшої обробки даних. CSV – для імпорту в інші програми.',
      },
    ],
  },
  {
    id: 'tips',
    icon: Lightbulb,
    title: 'Поради для малого бізнесу',
    color: '#B45309',
    bg: '#FFFBEB',
    content: [
      {
        type: 'tips_list',
        items: [
          { title: 'Починайте з малого', text: 'Додайте 10-20 найважливіших товарів. Не намагайтесь одразу завантажити весь асортимент.' },
          { title: 'Реєструйте продажі регулярно', text: 'Щоденна реєстрація дає найточніші прогнози. Мінімум – раз на тиждень.' },
          { title: 'Довіряйте прогнозам', text: 'Після 2-3 місяців роботи прогнози стають дуже точними. Використовуйте їх для планування закупок.' },
          { title: 'Перевіряйте Dashboard щоранку', text: 'Достатньо 1 хвилини щоб побачити чи є критичні залишки і прийняти рішення.' },
          { title: 'Використовуйте ABC для пріоритетів', text: 'Товари класу A завжди мають бути в наявності. На них зосередьте головну увагу.' },
          { title: 'Налаштуйте ролі для команди', text: 'Касирам давайте роль Менеджер, керівникам – Адмін, аналітикам – Аналітик.' },
        ],
      },
    ],
  },
];

type SectionId = string;

export default function HelpPage() {
  const [openSections, setOpenSections] = useState<Set<SectionId>>(new Set(['intro']));

  const toggle = (id: SectionId) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenSections(new Set(SECTIONS.map(s => s.id)));
  const collapseAll = () => setOpenSections(new Set());

  return (
    <div className="max-w-3xl mx-auto space-y-3">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Документація</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
          Інструкція користувача
        </h1>
        <p className="text-slate-500 text-sm">
          Повний посібник з використання системи управління запасами для малого і середнього бізнесу
        </p>
        <div className="flex gap-3 mt-4">
          <button onClick={expandAll}
            className="text-xs text-pink-600 hover:text-pink-800 font-medium flex items-center gap-1">
            <ChevronDown className="h-3 w-3" /> Розгорнути все
          </button>
          <span className="text-slate-300">·</span>
          <button onClick={collapseAll}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1">
            <ChevronRight className="h-3 w-3" /> Згорнути все
          </button>
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => {
        const isOpen = openSections.has(section.id);
        const Icon = section.icon;
        return (
          <div key={section.id} className="border bg-white overflow-hidden"
            style={{ borderRadius: '8px', borderColor: '#E8E9EC' }}>

            {/* Section header */}
            <button
              onClick={() => toggle(section.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: section.bg }}>
                  <Icon className="h-4 w-4" style={{ color: section.color }} />
                </div>
                <span className="font-semibold text-slate-800 text-sm">{section.title}</span>
              </div>
              {isOpen
                ? <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                : <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
              }
            </button>

            {/* Section content */}
            {isOpen && (
              <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid #F2F4F8' }}>
                {section.content.map((block: any, bi) => {
                  if (block.type === 'text') {
                    return (
                      <p key={bi} className="text-sm text-slate-600 leading-relaxed pt-4">
                        {block.value}
                      </p>
                    );
                  }

                  if (block.type === 'tip') {
                    return (
                      <div key={bi} className="flex gap-3 px-4 py-3 rounded"
                        style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-800">{block.value}</p>
                      </div>
                    );
                  }

                  if (block.type === 'warning') {
                    return (
                      <div key={bi} className="flex gap-3 px-4 py-3 rounded"
                        style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                        <AlertTriangle className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-orange-800">{block.value}</p>
                      </div>
                    );
                  }

                  if (block.type === 'steps') {
                    return (
                      <div key={bi}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3 mt-4">
                          {block.title}
                        </p>
                        <div className="space-y-2">
                          {block.items!.map((item: any, ii: number) => (
                            <div key={ii} className="flex items-start gap-3">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                                style={{ background: section.color, minWidth: '20px' }}>
                                {ii + 1}
                              </div>
                              <p className="text-sm text-slate-700">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (block.type === 'info') {
                    return (
                      <div key={bi}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 mt-4">
                          {block.title}
                        </p>
                        <div className="space-y-1.5">
                          {block.items!.map((item: any, ii: number) => (
                            <div key={ii} className="flex items-start gap-2">
                              <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: section.color }} />
                              <p className="text-sm text-slate-600">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (block.type === 'roles') {
                    return (
                      <div key={bi} className="space-y-3 pt-4">
                        {block.items!.map((r: any, ri: number) => (
                          <div key={r.role} className="border rounded p-4" style={{ borderColor: '#E8E9EC' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold px-2 py-0.5 rounded"
                                style={{ background: `${r.color}15`, color: r.color }}>
                                {r.role}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{r.desc}</p>
                            <div className="space-y-1">
                              {r.can.map((c: string, ci: number) => (
                                <div key={ci} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-xs text-slate-500">{c}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (block.type === 'tips_list') {
                    return (
                      <div key={bi} className="grid grid-cols-1 gap-3 pt-4">
                        {block.items!.map((tip: any, ti: number) => (
                          <div key={ti} className="flex gap-3 p-4 rounded"
                            style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                            <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-amber-900 mb-0.5">{tip.title}</p>
                              <p className="text-xs text-amber-700">{tip.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Footer */}
      <div className="text-center py-6">
        <p className="text-xs text-slate-300">
          Система управління запасами · Склад і запаси · 2026
        </p>
      </div>
    </div>
  );
}
