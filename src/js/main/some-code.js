// document.addEventListener('click', function (event) {
// 	if (!event.target.matches('#click-me')) return;
// 	alert('You clicked me!');
// }, false);

var button = document.getElementById('click-me');
button.addEventListener('click', function () {
	alert('Mine Func!!!');
});