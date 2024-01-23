const obj = {
    name: "sanya",
    day: {
        revenue: 3000,
    },
    logs: {
        count: 3,
    }
}

const {name, ...newObj} = obj;

console.log(newObj);