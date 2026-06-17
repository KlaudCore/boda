const eventDate =
new Date("December 15, 2026 18:00:00");

function updateCountdown(){

const now =
new Date().getTime();

const distance =
eventDate - now;

const days =
Math.floor(distance / (1000*60*60*24));

const hours =
Math.floor(
(distance % (1000*60*60*24))
/
(1000*60*60)
);

const minutes =
Math.floor(
(distance % (1000*60*60))
/
(1000*60)
);

const seconds =
Math.floor(
(distance % (1000*60))
/
1000
);

document.getElementById("days").innerText = days;
document.getElementById("hours").innerText = hours;
document.getElementById("minutes").innerText = minutes;
document.getElementById("seconds").innerText = seconds;

}

setInterval(updateCountdown,1000);

updateCountdown();