"use strict";
// Types and Interfaces
enum AvgCheckValue {
  low,
  mid,
  high,
}

interface IAvgCheck {
  isTrue: boolean;
  value: AvgCheckValue | null;
  set(value: AvgCheckValue): void;
  reset(): void;
}

interface IStatsFromForm {
  income: string;
  avgCheck: Pick<IAvgCheck, "isTrue" | "value">;
  feedbacks: string;
  salary: string;
}

interface IStatsToSend {
  monthId: string;
  [key: string]: IStatsFromForm | string;
}

interface IFetchedStats extends IStatsToSend {
  id: string;
}

/* ************************ CHECK URL ************************ */
const url = new URL("https://65aa56f4081bd82e1d96b36a.mockapi.io/test/salary");
/* const url = new URL(
  "https://65aa56f4081bd82e1d96b36a.mockapi.io/test/forTests"
); */

// date fields fill
const currentDateInput = document.querySelector(
  ".current-date"
) as HTMLInputElement;
const periodStartDateInput = document.querySelector(
  "#period-start-input"
) as HTMLInputElement;
const periodEndDateInput = document.querySelector(
  "#period-end-input"
) as HTMLInputElement;

currentDateInput.value = dateToStr(new Date());
const currentDate = getSelectedDate();
periodStartDateInput.value = dateToStr(
  new Date(Number(currentDate.year), Number(currentDate.month) - 1, 1)
);

periodEndDateInput.value = dateToStr(
  new Date(Number(currentDate.year), Number(currentDate.month), 0)
);

// main variables
const collectorForm = document.querySelector(".form-main") as HTMLFormElement;
const avgCheckField = document.querySelector(".avg-check") as HTMLInputElement;
const feedbacksField = document.querySelector(".feedbacks") as HTMLInputElement;
const incomeInput = document.querySelector("#income-today") as HTMLInputElement;
const feedbacksInput = document.querySelector(
  "#feedbacks-input"
) as HTMLInputElement;
const radioOptionalArea = document.querySelector(
  ".radio-optional"
) as HTMLElement;
const submitBtn = document.querySelector(".submit") as HTMLButtonElement;

const avgCheck: IAvgCheck = {
  isTrue: false,
  value: null,
  set(value: AvgCheckValue) {
    this.value = value;
    this.isTrue = true;
  },
  reset() {
    this.value = null;
    this.isTrue = false;
  },
};
const monthIdtoId = new Map();

// feedbacks count
feedbacksField.addEventListener("click", (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const button = target.closest(".adjust-btn");

  if (!button) return;

  if (button.getAttribute("id") === "increase-btn") {
    feedbacksInput.value = (Number(feedbacksInput.value) + 1).toString();
  }
  if (
    button.getAttribute("id") === "decrease-btn" &&
    Number(feedbacksInput.value) > 0
  ) {
    feedbacksInput.value = (Number(feedbacksInput.value) - 1).toString();
  }
});

// radio handlers
const radioYesOpt = document.querySelector("#radio-true") as HTMLInputElement;
const radioNoOpt = document.querySelector("#radio-false") as HTMLInputElement;
radioYesOpt.addEventListener("change", radioMainHandler);
radioNoOpt.addEventListener("change", radioMainHandler);

collectorForm.addEventListener("submit", (event: SubmitEvent) => {
  event.preventDefault();
  const stats = getTodayStats();
  const statsForToday = stats[`day_${getSelectedDate().day}`] as IStatsFromForm;
  showSalary(statsForToday.salary);
  /*   showSalary(stats[Object.keys(stats)[1]].salary); */
  sendStats(stats);
});

// gettings statistics
const presentorForm = document.querySelector(
  ".stats-for-period"
) as HTMLFormElement;

presentorForm.addEventListener("submit", async (e: SubmitEvent) => {
  e.preventDefault();

  const periodStartInput = document.querySelector(
    "#period-start-input"
  ) as HTMLInputElement;
  const periodEndInput = document.querySelector(
    "#period-end-input"
  ) as HTMLInputElement;

  const periodStartArr = periodStartInput.value.split("-");
  const periodEndArr = periodEndInput.value.split("-");

  const periodStart = {
    monthId: Number(periodStartArr[1]),
    day: Number(periodStartArr[2]),
  };
  const periodEnd = {
    monthId: Number(periodEndArr[1]),
    day: Number(periodEndArr[2]),
  };

  const fetchStartTime = Date.now();
  const stats = await getAllStats();
  const dataFetchedTime = Date.now();

  const filteredStats = stats.filter(
    (elem: IFetchedStats) =>
      Number.parseInt(elem.monthId) >= periodStart.monthId &&
      Number.parseInt(elem.monthId) <= periodEnd.monthId
  );

  if (document.querySelector(".stats")) {
    document.querySelector(".stats")?.remove();
  }

  const statsDiv = createElement("div", "stats");
  statsDiv.addEventListener("click", correctStatStyle);
  statsDiv.addEventListener("click", deleteDayFromDB);
  presentorForm.after(statsDiv);

  if (!filteredStats.length) return;

  let salaryForPeriod = 0;
  filteredStats.forEach(({ id, monthId, ...days }: IFetchedStats) => {
    monthIdtoId.set(monthId, id);
    const monthDiv = createElement("div", "month-container", statsDiv);

    Object.entries(days)
      .sort((a, b) => Number(a[0].slice(-2)) - Number(b[0].slice(-2)))
      .forEach(([key, data]) => {
        if (typeof data === "string") return;

        if (!data.salary) return;

        if (
          Number(monthId) === periodStart.monthId &&
          Number(key.slice(-2)) < periodStart.day
        ) {
          return;
        }
        if (
          Number(monthId) === periodEnd.monthId &&
          Number(key.slice(-2)) > periodEnd.day
        ) {
          return;
        }

        const detailsElem = createElement("details", null, monthDiv);

        // create summary
        const summaryElem = createElement("summary", "main-data", detailsElem);

        const dateElem = createElement("p", "date", summaryElem);
        dateElem.innerHTML = `${key.slice(-2)}.${monthId}`;

        const salaryElem = createElement("p", "salary", summaryElem);
        salaryElem.innerHTML = `${data.salary} ₽`;
        salaryForPeriod += Number(data.salary);

        // create p (optional-data)
        const optionalData = createElement("p", "optional-data", detailsElem);

        // income
        const incomeContainer = createElement("p", "income", optionalData);

        const incomeTitle = createElement("p", "income-title", incomeContainer);
        incomeTitle.innerHTML = `Выручка:`;

        const incomeValue = createElement("p", "income-value", incomeContainer);
        incomeValue.innerHTML = `${data.income} ₽`;

        // avg-check
        const avgCheckContainer = createElement("p", "avg-check", optionalData);

        const avgCheckTitle = createElement(
          "p",
          "avg-check-title",
          avgCheckContainer
        );
        avgCheckTitle.innerHTML = `Средний чек:`;

        const avgCheckValue = createElement(
          "p",
          "avg-check-value",
          avgCheckContainer
        );
        avgCheckValue.innerHTML = `${getAvgCheckByLabel(data.avgCheck.value)}`;

        // feedbacks
        const feedbacksContainer = createElement(
          "p",
          "feedbacks",
          optionalData
        );

        const feedbacksTitle = createElement(
          "p",
          "feedbacks-title",
          feedbacksContainer
        );
        feedbacksTitle.innerHTML = `Отзывы:`;

        const feedbacksValue = createElement(
          "p",
          "feedbacks-value",
          feedbacksContainer
        );
        feedbacksValue.innerHTML = `${data.feedbacks}шт.`;

        const deleteBtn = createElement(
          "button",
          "delete-day-btn",
          optionalData
        );
        deleteBtn.innerHTML = "Удалить данные за день";
      });
  });

  if (document.querySelector(".salary-sum")) {
    document.querySelector(".salary-sum")?.remove();
  }

  const salaryForPeriodContainer = createElement("div", "salary-sum");
  const salaryForPeriodTitle = createElement("p", "salary-sum-title");
  const salaryForPeriodValue = createElement("p", "salary-sum-value");
  salaryForPeriodTitle.innerHTML = "Итого:";
  salaryForPeriodValue.innerHTML = `${salaryForPeriod} ₽`;

  salaryForPeriodContainer.append(salaryForPeriodTitle);
  salaryForPeriodContainer.append(salaryForPeriodValue);
  statsDiv.before(salaryForPeriodContainer);

  if (presentorForm.getBoundingClientRect().top > 0) {
    const statsPosition =
      presentorForm.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: statsPosition,
      left: 0,
      behavior: "smooth",
    });
  }

  const end = Date.now();
  console.log(`
        От старта до получения данных: ${
          (dataFetchedTime - fetchStartTime) / 1000
        }
        От получения данных до выхода: ${(end - dataFetchedTime) / 1000}
    `);
});

// Functions

function deleteDayFromDB(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const deleteDayBtn = target.closest(".delete-day-btn") as HTMLButtonElement;
  if (!deleteDayBtn) return;
  const dayInfoContainer = target.closest("details") as HTMLElement;
  const modal = createModal();
  document.body.style.overflow = "hidden";
  document.body.prepend(modal);
  const closeModalBtn = modal.querySelector(
    ".modal-close-btn"
  ) as HTMLButtonElement;
  const cancelBtn = modal.querySelector(
    ".modal-cancel-btn"
  ) as HTMLButtonElement;
  const confirmBtn = modal.querySelector(
    ".modal-confirm-btn"
  ) as HTMLButtonElement;

  const chosenDate = {
    monthId: dayInfoContainer.querySelector(".date")?.innerHTML.split(".")[1],
    day: dayInfoContainer.querySelector(".date")?.innerHTML.split(".")[0],
    salary: Number.parseInt(
      dayInfoContainer.querySelector(".salary")!.innerHTML
    ),
  };
  const emtyObj: {
    [k: string]: {};
  } = {};

  emtyObj[`day_${chosenDate.day}`] = {};

  closeModalBtn.onclick = cancelBtn.onclick = closeModal;

  confirmBtn.onclick = () => {
    // correct sum
    const totalSumContainer = document.querySelector(
      ".salary-sum-value"
    ) as HTMLElement;
    totalSumContainer.innerHTML = `${
      Number.parseInt(totalSumContainer.innerHTML) - chosenDate.salary
    } ₽`;

    patchStats(monthIdtoId.get(chosenDate.monthId), emtyObj);
    closeModal();
    dayInfoContainer.remove();
  };
}

function createModal() {
  const modalContainer = createElement("div", "modal");
  const modalContent = createElement("div", "modal-content", modalContainer);
  const modalImg = createElement("img", null, modalContent) as HTMLImageElement;
  modalImg.src = "images/face-surprise-svgrepo-com.svg";
  const modalText = createElement("p", "modal-text", modalContent);
  modalText.innerHTML = "Данные за этот день будут удалены. <br> Вы тут?";
  const modalButtonsContainer = createElement(
    "div",
    "modal-buttons-contaner",
    modalContent
  );
  const cancelBtn = createElement(
    "button",
    "modal-cancel-btn",
    modalButtonsContainer
  );
  cancelBtn.innerHTML = "Отмена";
  const confirmBtn = createElement(
    "button",
    "modal-confirm-btn",
    modalButtonsContainer
  );
  confirmBtn.innerHTML = "ОК";
  const closeModalBtn = createElement(
    "button",
    "modal-close-btn",
    modalContent
  );
  const closeModalBtnImg = createElement(
    "img",
    null,
    closeModalBtn
  ) as HTMLImageElement;
  closeModalBtnImg.src = "images/cross-svgrepo-com.svg";
  return modalContainer;
}

function closeModal() {
  document?.querySelector(".modal")?.remove();
  document.body.style.overflow = "";
}

function correctStatStyle(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const summaryElem = target.closest(".main-data");
  if (!summaryElem) return;
  const date = summaryElem.querySelector(".date") as HTMLParagraphElement;
  const salary = summaryElem.querySelector(".salary") as HTMLParagraphElement;
  if (!summaryElem.closest("details")?.hasAttribute("open")) {
    console.log("no attribute");
    date.style.borderBottomLeftRadius = "0px";
    salary.style.borderBottomRightRadius = "0px";
  } else {
    date.style.borderBottomLeftRadius = "7px";
    salary.style.borderBottomRightRadius = "7px";
  }
}

function getAvgCheckByLabel(label: AvgCheckValue | null) {
  switch (label) {
    case AvgCheckValue.high:
      return "Больше 550 ₽";
    case AvgCheckValue.mid:
      return "501 ₽ — 550 ₽";
    case AvgCheckValue.low:
      return "451 ₽ — 500 ₽";
    case null:
      return "Нет";
  }
}

function createElement(
  tag: string,
  className?: string | null,
  parrent?: HTMLElement | null
) {
  const elem = document.createElement(tag);
  if (className) elem.classList.add(className);
  if (parrent) parrent.append(elem);
  return elem;
}

function getTodayStats() {
  const { month, day } = getSelectedDate();
  const salary = Math.floor(calculateSalary());
  const { isTrue, value } = avgCheck;

  const statsToday: IStatsToSend = {
    monthId: month,
  };
  statsToday[`day_${day}`] = {
    income: incomeInput.value,
    avgCheck: { isTrue, value },
    feedbacks: feedbacksInput.value,
    salary: salary.toString(),
  };

  return statsToday;
}

function getSelectedDate() {
  const dateArr = currentDateInput.value.split("-");
  return {
    year: dateArr[0],
    month: dateArr[1],
    day: dateArr[2],
  };
}

function showSalary(salary: string) {
  if (document.querySelector(".salary-today")) {
    document.querySelector(".salary-today")?.remove();
  }

  const salaryContainer = createElement("div", "salary-today");
  collectorForm.after(salaryContainer);

  const salaryTextElem = createElement("p", "salary-text", salaryContainer);
  const salaryValueElem = createElement("p", "salary-value", salaryContainer);

  salaryTextElem.innerHTML = `Зарплата за ${getSelectedDate().day}.${
    getSelectedDate().month
  }`;
  salaryValueElem.innerHTML = `${salary} ₽`;
}

function calculateSalary() {
  let result = 2000;

  if (+incomeInput.value <= 50000) {
    result += 500;
  } else {
    result += +incomeInput.value * 0.01;
  }

  if (+feedbacksInput.value) {
    result += +feedbacksInput.value * 50;
  }

  if (radioOptionalArea.classList.contains("hidden")) {
    avgCheck.reset();
    return result;
  }

  const avgCheckLow = document.querySelector(
    "#radio-optional-low"
  ) as HTMLInputElement;
  const avgCheckMid = document.querySelector(
    "#radio-optional-mid"
  ) as HTMLInputElement;
  const avgCheckHigh = document.querySelector(
    "#radio-optional-high"
  ) as HTMLInputElement;

  if (avgCheckLow.checked) {
    result += 200;
    avgCheck.set(AvgCheckValue.low);
  }
  if (avgCheckMid.checked) {
    result += 300;
    avgCheck.set(AvgCheckValue.mid);
  }
  if (avgCheckHigh.checked) {
    result += 400;
    avgCheck.set(AvgCheckValue.high);
  }
  return result;
}

function radioMainHandler() {
  radioOptionalArea.classList.toggle("hidden");
}

function dateToStr(date: Date) {
  const currentDay =
    date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
  const currentMonth =
    date.getMonth() + 1 < 10
      ? "0" + (date.getMonth() + 1)
      : date.getMonth() + 1;

  return `${date.getFullYear()}-${currentMonth}-${currentDay}`;
}

// Асинхронные операции
async function sendStats(stats: IStatsToSend) {
  const { monthId, ...data } = stats;
  const searchUrl = new URL(url.toString());
  searchUrl.searchParams.append("monthId", String(monthId));

  // Ищем есть ли в базе месяц с таким номером
  const response = await fetch(searchUrl, {
    method: "GET",
    headers: { "content-type": "application/json" },
  });

  if (!response.ok) {
    //Если нет то создаем объект с этим monthId
    createNewMonth(stats);
    return;
  }
  //Если есть, то берем его id (не monthId!) и патчим по этому id
  const monthStats: IFetchedStats[] = await response.json();
  const id: string = monthStats[0].id;
  patchStats(id, data);
}

async function createNewMonth(stats: IStatsToSend) {
  const params = {
    method: "POST",
    headers: { "content-type": "application/json" },
    // Send your data in the request body as JSON
    body: JSON.stringify(stats),
  };
  fetch(url, params);
}

async function patchStats(id: string, stats: IStatsFromForm | {}) {
  const params = {
    method: "PUT",
    headers: { "content-type": "application/json" },
    // Send your data in the request body as JSON
    body: JSON.stringify(stats),
  };
  /*     fetch(`https://65aa56f4081bd82e1d96b36a.mockapi.io/test/forTests/${id}`, params); */
  fetch(`${url}/${id}`, params);
}

async function getAllStats() {
  const response = await fetch(url, {
    method: "GET",
    headers: { "content-type": "application/json" },
  });
  const stats: IFetchedStats[] = await response.json();
  return stats;
}
