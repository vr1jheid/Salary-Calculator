const arr = [1,2,3,4,5];

arr.forEach( e => {
    if (e === 4) return;
    console.log(e);
})

const test = !undefined ?? 10
console.log(test);