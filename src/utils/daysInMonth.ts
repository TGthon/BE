// https://stackoverflow.com/questions/315760/what-is-the-best-way-to-determine-the-number-of-days-in-a-month-with-javascript
// 아니 이게 뭐지
function daysInMonth(m: number, y: number){
    return m===2?y&3||!(y%25)&&y&15?28:29:30+(m+(m>>3)&1);
}