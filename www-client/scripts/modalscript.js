//Info modal
var modal1 = document.getElementById("info-modal");

var btn1 = document.getElementById("infos");

var closebtn1 = document.getElementsByClassName("fa-x")[0];

btn1.onclick = function() {
  modal1.style.display = "block";
}

closebtn1.onclick = function() {
  modal1.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == modal1 || event.target == modal2) {
    modal1.style.display = "none";
    modal2.style.display = "none";
  }
} 

//Settings modal

var modal2 = document.getElementById("settings-modal");

var btn2 = document.getElementById("settings");

var closebtn2 = document.getElementsByClassName("fa-x")[1];

btn2.onclick = function() {
  modal2.style.display = "block";
}

closebtn2.onclick = function() {
  modal2.style.display = "none";
}
