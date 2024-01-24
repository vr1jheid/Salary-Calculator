"use strict";
const dateInput = document.querySelector(".current-date");
dateInput.value = getCurrentDate();
const form = document.querySelector(".form-main");
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
    }
}
/* incomeInput.addEventListener("input", (event) => {
    
    if (+event.target.value >= 50000) {
        avgCheckField.removeAttribute("disabled");
        feedbacksField.removeAttribute("disabled");
    } else {
        avgCheckField.setAttribute("disabled", "");
        feedbacksField.setAttribute("disabled", "");
    }
}) */

feedbacksField.addEventListener("click", (event) => {
    const target = event.target.closest(".adjust-btn");
    if (!target) return;

    if (target.getAttribute("id") === "increase-btn") {
        feedbacksInput.value = +feedbacksInput.value + 1;
    }
    if (target.getAttribute("id") === "decrease-btn" && 
        feedbacksInput.value > 0) {
        feedbacksInput.value = +feedbacksInput.value - 1;
    }
})

const radioYesOpt = document.querySelector("#radio-true");
const radioNoOpt = document.querySelector("#radio-false");

radioYesOpt.addEventListener("change", radioMainHandler);
radioNoOpt.addEventListener("change", radioMainHandler);

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const stats = getTodayStats();
    console.log(avgCheck);
    console.log(stats);
    //showSalary(stats[`day_${getSelectedDate().day}`].salary);
    showSalary(stats[Object.keys(stats)[1]].salary);
    sendStats(stats);

})

const getStatsBtn = document.querySelector("#get-stats-btn");
const getStatsForm = document.querySelector(".stats-for-period");
getStatsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const startValue = document.querySelector("#period-start-input").value.split("-");
    const endValue = document.querySelector("#period-end-input").value.split("-");

    const periodStart = {
        monthId: +startValue[1],
        day: +startValue[2]
    }
    const periodEnd = {
        monthId: +endValue[1],
        day: +endValue[2]
    }

    const stats = await getAllStats();
    const filteredStats = stats.filter( elem => 
        Number.parseInt(elem.monthId) >= periodStart.monthId &&
        Number.parseInt(elem.monthId) <= periodEnd.monthId
    );

    if (document.querySelector(".stats")) {
        document.querySelector(".stats").remove();
    }

    const statsDiv = createElement("div", "stats");
    getStatsForm.after(statsDiv);

    if (!filteredStats.length) return;

    

    filteredStats.forEach( ({id, monthId, ...days}) => {
        console.log(monthId, days);
        const monthDiv = createElement("div", "month-container", statsDiv)

        Object
        .entries(days)
        .sort( (a,b) => Number(a[0].slice(-2)) - b[0].slice(-2))  
        .forEach( ([key, data]) => {

            if (Number(monthId) === periodStart.monthId &&
                Number(key.slice(-2)) < periodStart.day) {
                    return;
                }
            if (Number(monthId) === periodEnd.monthId &&
                Number(key.slice(-2)) > periodEnd.day) {
                    return;
                }
            

            const detailsElem = createElement("details", null, monthDiv)

            // create summary
            const summaryElem = createElement("summary", "main-data", detailsElem)

            const dateElem = createElement("span", "date", summaryElem)
            dateElem.innerHTML = `${key.slice(-2)}.${monthId}`;

            const salaryElem = createElement("span", "salary", summaryElem);
            salaryElem.innerHTML = `${data.salary}₽`;

            // create p (optional-data)
            const paragraphElem = createElement("p", "optional-data", detailsElem);
 
            // income
            const incomeContainer = createElement("span", "income", paragraphElem);

            const incomeTitle = createElement("span", "income-title", incomeContainer);
            incomeTitle.innerHTML = `Выручка:`;

            const incomeValue = createElement("span", "income-value", incomeContainer);
            incomeValue.innerHTML = `${data.income}₽`;

            // avg-check
            const avgCheckContainer = createElement("span", "avg-check", paragraphElem)

            const avgCheckTitle = createElement("span", "avg-check-title", avgCheckContainer);
            avgCheckTitle.innerHTML = `Средний чек:`

            const avgCheckValue = createElement("span", "avg-check-value", avgCheckContainer);
            avgCheckValue.innerHTML = `${getAvgCheckByLabel(data.avgCheck.value)}`;
            
            // feedbacks
            const feedbacksContainer = createElement("span", "feedbacks", paragraphElem);
            
            const feedbacksTitle = createElement("span", "feedbacks-title", feedbacksContainer);
            feedbacksTitle.innerHTML = `Отзывы:`;

            const feedbacksValue = createElement("span", "feedbacks-value", feedbacksContainer);
            feedbacksValue.innerHTML = `${data.feedbacks}шт.`;

        })      
        console.log("entries", Object
        .entries(days)
        .sort( (a,b) => Number(a[0].slice(-2)) - b[0].slice(-2)));
        
    });
    console.log(statsDiv);
/*     console.log(filteredStats);
    console.log(periodStart, periodEnd); */
})

/* submitBtn.addEventListener("click", () => {
    const salaryTextElem = document.querySelector(".salary-text");
    const salaryValElem = document.querySelector(".salary-value");

    salaryTextElem.innerHTML = `З/П за ${dateInput.value}:`;

    salaryValElem.innerHTML = `${calculateSalary()}`;
    

}) */
function getAvgCheckByLabel(label) {
    switch (label) {
        case "high":
            return "Больше 550₽";
        case "mid":
            return "501₽ — 550₽";
        case "low":
            return "451₽ — 500₽";
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
    const {isTrue, value} = avgCheck;

    const statsToday = {
        monthId: date.month,
    };
    statsToday[`day_${date.day}`] = {
        income: incomeInput.value,
        avgCheck: {isTrue, value},
        feedbacks: feedbacksInput.value,
        salary: salary,
    }

    return statsToday;
}

function getSelectedDate() {
    const dateArr = dateInput.value.split("-");
    return {
        year: dateArr[0],
        month: dateArr[1],
        day: dateArr[2]
    }
}

function showSalary(salary) {
    const salaryTextElem = document.querySelector(".salary-text");
    const salaryValElem = document.querySelector(".salary-value");

    salaryTextElem.innerHTML = `З/П за ${dateInput.value}:`;
    salaryValElem.innerHTML = `${salary}`;
}

function calculateSalary() {
    let result = 2000;

    if (+incomeInput.value <= 50000) {
        result += 500;
    } else {
        result += +incomeInput.value * 0.01;
    }

    if (+feedbacksInput.value) {
        result +=  +feedbacksInput.value * 50;
    }

    if (radioOptionalArea.classList.contains("hidden")) {
        avgCheck.reset();
        return result
    };

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

function getCurrentDate() {
    const currentDate = new Date;
    const currentDay = currentDate.getDate() < 10 ? "0" + currentDate.getDate(): currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1 < 10 ? "0" + (currentDate.getMonth() + 1): currentDate.getMonth() + 1;

    return `${currentDate.getFullYear()}-${currentMonth}-${currentDay}`;
}

// Асинхронные операции
const url = new URL("https://65aa56f4081bd82e1d96b36a.mockapi.io/test/salary");

async function sendStats(stats) {

    const {monthId, ...data} = stats;
/*     console.log(data); */
    const searchUrl = new URL (url.toString());
    searchUrl.searchParams.append("monthId", monthId);

    // Ищем есть ли в базе месяц с таким номером
    const response = await fetch(searchUrl,{
        method: 'GET',
        headers: {'content-type':'application/json'},
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
    patchStats(id, data);
}

async function createNewMonth(stats) {
    const params = {
        method: "POST",
        headers: {'content-type':'application/json'},
        // Send your data in the request body as JSON
        body: JSON.stringify(stats)
    }
    fetch(url, params);
}

async function patchStats(id, stats) {
    const params = {
        method: "PUT",
        headers: {'content-type':'application/json'},
        // Send your data in the request body as JSON
        body: JSON.stringify(stats)
    }
/*     fetch(`https://65aa56f4081bd82e1d96b36a.mockapi.io/test/forTests/${id}`, params); */
    fetch(`${url}/${id}`, params);
}

async function getAllStats() {

    const response = await fetch(url,{
        method: 'GET',
        headers: {'content-type':'application/json'},
      });
    const stats = await response.json();
    return stats;
}