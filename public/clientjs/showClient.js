function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// REPLACE HTML TAGS
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Like Content Button Function
function likeContent(contentId, userId){

  if (document.getElementById("likeButtonImage").src.match("/icons/icons8-facebook-like-48.png")) 
  {
    document.getElementById("likeButtonImage").src = "/icons/icons8-facebook-like-64.png";
  }
  else 
  {
    document.getElementById("likeButtonImage").src = "/icons/icons8-facebook-like-48.png";
  }

  var data = {
    'contentId': contentId,
    'userId': userId
  };

  socket.emit('likeContent', data);
};