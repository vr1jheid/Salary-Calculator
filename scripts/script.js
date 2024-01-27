"use strict";
/* ************************ CHECK URL ************************ */
const url = new URL("https://65aa56f4081bd82e1d96b36a.mockapi.io/test/salary");
/* const url = new URL(
  "https://65aa56f4081bd82e1d96b36a.mockapi.io/test/forTests"
); */

// date fields fill
const currentDateInput = document.querySelector(".current-date");
currentDateInput.value = dateToStr(new Date());
const periodStartDateInput = document.querySelector("#period-start-input");
const periodEndDateInput = document.querySelector("#period-end-input");
const currentDate = getSelectedDate();
periodStartDateInput.value = dateToStr(
  new Date(currentDate.year, currentDate.month - 1, 1)
);
periodEndDateInput.value = dateToStr(
  new Date(currentDate.year, currentDate.month, 0)
);

// main variables
const collectorForm = document.querySelector(".form-main");
const avgCheckField = document.querySelector(".avg-check");
const feedbacksField = document.querySelector(".feedbacks");
const incomeInput = document.querySelector("#income-today");
const feedbacksInput = document.querySelector("#feedbacks-input");
const radioOptionalArea = document.querySelector(".radio-optional");
const submitBtn = document.querySelector(".submit");

const avgCheck = {
  isTrue: false,
  value: null,
  set(value) {
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
feedbacksField.addEventListener("click", (event) => {
  const target = event.target.closest(".adjust-btn");
  if (!target) return;

  if (target.getAttribute("id") === "increase-btn") {
    feedbacksInput.value = +feedbacksInput.value + 1;
  }
  if (
    target.getAttribute("id") === "decrease-btn" &&
    feedbacksInput.value > 0
  ) {
    feedbacksInput.value = +feedbacksInput.value - 1;
  }
});

// radio handlers
const radioYesOpt = document.querySelector("#radio-true");
const radioNoOpt = document.querySelector("#radio-false");
radioYesOpt.addEventListener("change", radioMainHandler);
radioNoOpt.addEventListener("change", radioMainHandler);

collectorForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const stats = getTodayStats();
  console.log(avgCheck);
  console.log(stats);
  //showSalary(stats[`day_${getSelectedDate().day}`].salary);
  showSalary(stats[Object.keys(stats)[1]].salary);
  sendStats(stats);
});

// gettings statistics
const presentorForm = document.querySelector(".stats-for-period");

presentorForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const startValue = document
    .querySelector("#period-start-input")
    .value.split("-");
  const endValue = document.querySelector("#period-end-input").value.split("-");

  const periodStart = {
    monthId: +startValue[1],
    day: +startValue[2],
  };
  const periodEnd = {
    monthId: +endValue[1],
    day: +endValue[2],
  };

  const fetchStartTime = Date.now();
  const stats = await getAllStats();
  const dataFetchedTime = Date.now();

  const filteredStats = stats.filter(
    (elem) =>
      Number.parseInt(elem.monthId) >= periodStart.monthId &&
      Number.parseInt(elem.monthId) <= periodEnd.monthId
  );

  if (document.querySelector(".stats")) {
    document.querySelector(".stats").remove();
  }

  const statsDiv = createElement("div", "stats");
  statsDiv.addEventListener("click", correctStatStyle);
  statsDiv.addEventListener("click", deleteDayFromDB);
  presentorForm.after(statsDiv);

  if (!filteredStats.length) return;

  let salaryForPeriod = 0;
  filteredStats.forEach(({ id, monthId, ...days }) => {
    monthIdtoId.set(monthId, id);
    const monthDiv = createElement("div", "month-container", statsDiv);

    Object.entries(days)
      .sort((a, b) => Number(a[0].slice(-2)) - b[0].slice(-2))
      .forEach(([key, data]) => {
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
    document.querySelector(".salary-sum").remove();
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

function deleteDayFromDB(e) {
  const target = e.target.closest(".delete-day-btn");
  if (!target) return;
  const dayInfoContainer = e.target.closest("details");
  const modal = createModal();
  document.body.style.overflow = "hidden";
  document.body.prepend(modal);
  const closeModalBtn = modal.querySelector(".modal-close-btn");
  const cancelBtn = modal.querySelector(".modal-cancel-btn");
  const confirmBtn = modal.querySelector(".modal-confirm-btn");

  const chosenDate = {
    monthId: dayInfoContainer.querySelector(".date").innerHTML.split(".")[1],
    day: dayInfoContainer.querySelector(".date").innerHTML.split(".")[0],
    salary: Number.parseInt(dayInfoContainer.querySelector(".salary").innerHTML)
  };
  const emtyObj = {};
  emtyObj[`day_${chosenDate.day}`] = {};
  console.log(chosenDate);
  console.log(emtyObj);
  closeModalBtn.onclick = cancelBtn.onclick = closeModal;

  confirmBtn.onclick = () => {
    // correct sum
    const totalSumContainer = document.querySelector(".salary-sum-value");
    totalSumContainer.innerHTML = `${Number.parseInt(totalSumContainer.innerHTML) - chosenDate.salary} ₽`

    patchStats(monthIdtoId.get(chosenDate.monthId), emtyObj);
    closeModal();
    dayInfoContainer.remove();
  };
}

function createModal() {
  const modalContainer = createElement("div", "modal");
  const modalContent = createElement("div", "modal-content", modalContainer);
  const modalImg = createElement("img", null, modalContent);
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
  const closeModalBtnImg = createElement("img", null, closeModalBtn);
  closeModalBtnImg.src = "images/cross-svgrepo-com.svg";
  return modalContainer;
}

function closeModal() {
  document.querySelector(".modal").remove();
  document.body.style.overflow = "";
}

function correctStatStyle(e) {
  // Костыль - пофиксить
  if (e.target.closest(".delete-day-btn")) return;
  //
  const target = e.target.closest("details");
  if (!target) return;
  console.log("here");
  const date = target.querySelector(".date");
  const salary = target.querySelector(".salary");

  if (!target.hasAttribute("open")) {
    date.style.borderBottomLeftRadius = "0px";
    salary.style.borderBottomRightRadius = "0px";
  } else {
    date.style.borderBottomLeftRadius = "7px";
    salary.style.borderBottomRightRadius = "7px";
  }
}

function getAvgCheckByLabel(label) {
  switch (label) {
    case "high":
      return "Больше 550 ₽";
    case "mid":
      return "501 ₽ — 550 ₽";
    case "low":
      return "451 ₽ — 500 ₽";
    case null:
      return "Нет";
  }
}

function createElement(tag, className, parrent) {
  const elem = document.createElement(tag);
  if (className) elem.classList.add(className);
  if (parrent) parrent.append(elem);
  return elem;
}

function getTodayStats() {
  const date = getSelectedDate();
  const salary = Math.floor(calculateSalary());
  const { isTrue, value } = avgCheck;

  const statsToday = {
    monthId: date.month,
  };
  statsToday[`day_${date.day}`] = {
    income: incomeInput.value,
    avgCheck: { isTrue, value },
    feedbacks: feedbacksInput.value,
    salary: salary,
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

function showSalary(salary) {
  if (document.querySelector(".salary-today")) {
    document.querySelector(".salary-today").remove();
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

  const avgCheckLow = document.querySelector("#radio-optional-low");
  const avgCheckMid = document.querySelector("#radio-optional-mid");
  const avgCheckHigh = document.querySelector("#radio-optional-high");

  if (avgCheckLow.checked) {
    result += 200;
    avgCheck.set("low");
  }
  if (avgCheckMid.checked) {
    result += 300;
    avgCheck.set("mid");
  }
  if (avgCheckHigh.checked) {
    result += 400;
    avgCheck.set("high");
  }
  return result;
}

function radioMainHandler() {
  radioOptionalArea.classList.toggle("hidden");
}

function dateToStr(date) {
  const currentDay =
    date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
  const currentMonth =
    date.getMonth() + 1 < 10
      ? "0" + (date.getMonth() + 1)
      : date.getMonth() + 1;

  return `${date.getFullYear()}-${currentMonth}-${currentDay}`;
}

// Асинхронные операции
async function sendStats(stats) {
  const { monthId, ...data } = stats;
  /*     console.log(data); */
  const searchUrl = new URL(url.toString());
  searchUrl.searchParams.append("monthId", monthId);

  // Ищем есть ли в базе месяц с таким номером
  const response = await fetch(searchUrl, {
    method: "GET",
    headers: { "content-type": "application/json" },
  });

  /*     console.log(response); */

  if (!response.ok) {
    //Если нет то создаем объект с этим monthId
    createNewMonth(stats);
    return;
  }
  //Если есть, то берем его id (не monthId!) и патчим по этому id
  const monthStats = await response.json();
  /*     console.log(monthStats); */
  const id = monthStats[0].id;
  console.log(data);
  patchStats(id, data);
}

async function createNewMonth(stats) {
  const params = {
    method: "POST",
    headers: { "content-type": "application/json" },
    // Send your data in the request body as JSON
    body: JSON.stringify(stats),
  };
  fetch(url, params);
}

async function patchStats(id, stats) {
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
  const stats = await response.json();
  return stats;
}
