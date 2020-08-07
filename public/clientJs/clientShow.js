// Currently working on seperating javascript codes from content show page
var xhr = new XMLHttpRequest();

function showReplyForm(id) {
  document.getElementById(id).style.display = '';
}

function hideReplyForm(id) {
  document.getElementById(id).style.display = 'none';
}

function hideReply(id) {
  document.getElementById(id + 'Replies').style.display = 'none';
  document.getElementById(id + 'RepliesViewReplyButton').style.display = '';
  document.getElementById(id + 'RepliesHideReplyButton').style.display = 'none';
}

function viewReply(id) {
  document.getElementById(id + 'Replies').style.display = '';
  document.getElementById(id + 'RepliesHideReplyButton').style.display = '';
  document.getElementById(id + 'RepliesViewReplyButton').style.display = 'none';
}

var socket = io();

//======================COMMENT SECTION==============================
function submitComment(userId, userUsername, userThumbnail){
  //javascript built in date to sort
  var timeNow = Date.now();
  //moment js to show date
  var dateNow = moment();
  var comment = document.getElementById("commentTextarea").value
  var contentId = document.getElementById("contentId").value
  var commentAuthor = {
    id: userId,
    username: userUsername,
    thumbnail: userThumbnail
  };

  if(comment != ''){

    var data = {
      'comment': comment,
      'contentId': contentId,
      'author': commentAuthor,
      'createdAt': timeNow,
      'date': dateNow,
      'edited': false
    };
    var newComments = document.getElementById('newComments');
    newComments.insertAdjacentHTML('beforeEnd', "<div class='line'><a href='/profile/"+ commentAuthor.id + "'><div class='line'><img src='" + commentAuthor.thumbnail + "' style='border-radius: 50%; width: 35px; height: 35px;'>&nbsp;</div><div class='line'>" + escapeHtml(commentAuthor.username) + "&nbsp;</div></a></div><div class='line infoTextColor'>" + moment(dateNow).fromNow() + "</div><div class='breakWord' style='padding-left: 2.5em; padding-bottom: 15px;'>" + escapeHtml(comment) + "</div>");
    document.getElementById("commentTextarea").value = '';

    socket.emit('comment', data);
  }
};
 
socket.on('comment', function(data){
  var contentId = "<%= content.id %>";

  if(contentId == data.contentId){
    var newComments = document.getElementById('newComments');
    newComments.insertAdjacentHTML('beforeEnd', "<div class='line'><a href='/profile/"+ commentAuthor.id + "'><div class='line'><img src='" + commentAuthor.thumbnail + "' style='border-radius: 50%; width: 35px; height: 35px;'>&nbsp;</div><div class='line'>" + escapeHtml(commentAuthor.username) + "&nbsp;</div></a></div><div class='line infoTextColor'>" + moment(dateNow).fromNow() + "</div><div class='breakWord' style='padding-left: 2.5em;'>" + escapeHtml(comment) + "</div>");
  }
});

function deleteComment(id){
  
  document.getElementById(id + 'ExComments').remove();
  var data = {
    'currentUser': '<%= user.id %>',
    'commentId': id
  }

  socket.emit('deleteComment', data);

};

function editComment(id, comment, originalDate){
  var commentToEditChild = document.getElementById(id + 'ExCommentChild');
  commentToEditChild.style.display = 'none';

  var commentToEdit = document.getElementById(id + 'ExComments');

  commentToEdit.insertAdjacentHTML('beforeEnd', "<div id='" + id + "EditCommentForm' style='padding-top: 5px;'><img class='line' src='<%=user.thumbnail%>' style='border-radius: 50%; width: 35px; height: 35px;'>&nbsp;<div class='line'><%=user.username%></div><div><textarea class='commentReplyTextarea' id='" + id + "EditCommentTextarea'>" + escapeHtml(comment) + "</textarea></br></div><div align='right'><div class='line' style='padding-right: 5px;'><button class='noOutline btn btn-outline-dark' onClick='cancelEditComment(\"" + id + "\"); return false;'>CANCEL</button></div><div class='line'><button class='noOutline btn btn-outline-dark' onClick='submitEditComment(\"" + id + "\", \"" + originalDate + "\"); return false;'>SAVE</button></div></div></div>" 
  )
};

function cancelEditComment(id){
  document.getElementById(id + 'EditCommentForm').remove();
  var commentToEditChild = document.getElementById(id + 'ExCommentChild');
  commentToEditChild.style.display = '';
}

function submitEditComment(id, originalDate){

  var newComment = document.getElementById(id + 'EditCommentTextarea').value;

  if(newComment != ''){
    var data = {
      'currentUser': '<%= user.id %>',
      'commentId': id,
      'comment': newComment
    }

    socket.emit('editComment', data);

    document.getElementById(id + 'ExComments').insertAdjacentHTML('beforeEnd', "<div class='line'><div class='line'><img src='<%=user.thumbnail%>' style='border-radius: 50%; width: 35px; height: 35px;'>&nbsp;</div><div class='line'><%=user.username%>&nbsp;</div></a></div><div class='line infoTextColor'>" + originalDate + "</div><div class='breakWord' style='padding-left: 2.5em;'>" + escapeHtml(newComment) + "</div>");

    document.getElementById(id + 'EditCommentForm').remove();
  }
}

//=====================REPLY SECTION============================

function deleteReply(replyId, commentId){
  document.getElementById(replyId + 'ExReplies').remove();
  var data = {
    'currentUser': '<%= user.id %>',
    'replyId': replyId,
    'commentId': commentId
  };
  socket.emit('deleteReply', data);
};

//====================EDIT REPLY PART=====================
function editReply(replyId, commentId, reply, originalDate){
  var replyToEditChild = document.getElementById(replyId + 'ExRepliesChild');
  replyToEditChild.style.display = 'none';

  var replyToEdit = document.getElementById(replyId + 'ExReplies');

  replyToEdit.insertAdjacentHTML('beforeEnd', "<div id='" + replyId + "EditReplyForm' style='padding-top: 5px;'><img class='line' src='<%=user.thumbnail%>' style='border-radius: 50%; width: 25px; height: 25px;'><div><textarea class='commentReplyTextarea' id='" + replyId + "EditReplyTextarea'>" + escapeHtml(reply) + "</textarea></br></div><div align='right'><div class='line' style='padding-right: 5px;'><button class='noOutline btn btn-outline-dark' onClick='cancelEditReply(\"" + replyId + "\"); return false;'>CANCEL</button></div><div class='line'><button class='noOutline btn btn-outline-dark' onClick='submitEditReply(\"" + replyId + "\", \"" + commentId + "\", \"" + originalDate + "\"); return false;'>SAVE</button></div></div></div>" 
  )
};

function cancelEditReply(id){
  document.getElementById(id + 'EditReplyForm').remove();
  var replyToEditChild = document.getElementById(id + 'ExRepliesChild');
  replyToEditChild.style.display = '';
}

function submitEditReply(replyId, commentId, originalDate){

  var newReply = document.getElementById(replyId + 'EditReplyTextarea').value;

  if(newReply != ''){
    var data = {
      'currentUser': '<%= user.id %>',
      'replyId': replyId,
      'commentId': commentId,
      'reply': newReply
    }

    socket.emit('editReply', data);

    document.getElementById(replyId + 'ExReplies').insertAdjacentHTML('beforeEnd', "<div class='line'><div class='line'><img src='<%=user.thumbnail%>' style='border-radius: 50%; width: 25px; height: 25px;'>&nbsp;</div><div class='line'><%=user.username%>&nbsp;</div></a></div><div class='line infoTextColor'>" + originalDate + "</div><div class='breakWord' style='padding-left: 2.5em;'>" + escapeHtml(newReply) + "</div>");

    document.getElementById(replyId + 'EditReplyForm').remove();
  }
}

function replySubmit(id) {

  var reply = document.getElementById(id+"ReplyTextarea").value
  var commentId = id;
  //javascript built in date to sort
  var timeNow = Date.now();
  //moment js to show date
  var dateNow = moment();
  
  var replyAuthor = {
    id: "<%= user.id %>",
    username: "<%= user.username %>",
    thumbnail: "<%= user.thumbnail %>"
  };

  if(reply != ''){

    var data = {
      'commentId': commentId,
      'reply': reply,
      'author': replyAuthor,
      'createdAt': timeNow,
      'date': dateNow,
      'edited': false
    };

    var newReplies = document.getElementById(id+"NewReplies");
    newReplies.insertAdjacentHTML('beforeEnd', "<div class='line'><a href='/profile/" + replyAuthor.id + "'><div class='line'><img src='" + replyAuthor.thumbnail + "' style='border-radius: 50%; width: 25px; height: 25px;'>&nbsp;</div><div class='line'>" + escapeHtml(replyAuthor.username) + "&nbsp;</div></a></div><div class='line infoTextColor'>" + moment(dateNow).fromNow() + "</div><div class='breakWord' style='padding-left: 2.5em; padding-bottom: 15px;'>"  + escapeHtml(reply) + "</div>");

    document.getElementById(id+"ReplyTextarea").value = '';

    socket.emit('reply', data);
  }
}

socket.on('reply', function(data){
  if(commentId = data.commentId){
    var newReplies = document.getElementById(id+"NewReplies");
    newReplies.insertAdjacentHTML('beforeEnd', "<div class='line'><a href='/profile/" + replyAuthor.id + "'><div class='line'><img src='" + replyAuthor.thumbnail + "' style='border-radius: 50%; width: 25px; height: 25px;'>&nbsp;</div><div class='line'>" + escapeHtml(replyAuthor.username) + "&nbsp;</div></a></div><div class='line infoTextColor'>" + moment(dateNow).fromNow() + "</div><div class='breakWord' style='padding-left: 2.5em;'>"  + escapeHtml(reply) + "</div>");
  }
});

//LIKE CONTENT 
socket.on('contentLikeUpdate', function(data){
  var likeButtonCount = document.getElementById("likeButtonCount")
  console.log("data likeupdate: " + data);
  if(data > 1000) {
    likeButtonCount.innerHTML = Math.floor(data/1000) + 'K Likes'
  } else if(data > 1) {  
    likeButtonCount.innerHTML = data + ' Likes';
  } else {
    likeButtonCount.innerHTML = data + ' Like';
  }
});

// PAGINATION FITURES
// initialization before all functions
var page = 1; 
var perPage = 12;
var current = page;

// How many contents we found 
var count = "<%= commentCount %>";

// How many pages we have 
var pages = Math.ceil(count*1.0 / perPage)
var pageCut = pages + 1;

window.onscroll = function(ev) {
if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
    page++;
    current = page;

    if(current <= pages){
      loadMoreComment(page);
    }

    // When current equals pageCut it appends an alert
    else if(current == pageCut) {
      var comments = document.getElementById('comments');
      comments.insertAdjacentHTML('beforeEnd', "<div style='text-align: center;' class='contents alert alert-dark' role='alert'><p style='text-align: center;'>End of Comments</p></div>");
    }
  }
};

function loadMoreComment(currentPage){
  xhr.open('GET', "/contents/<%=content.id%>/?page=" + currentPage);
  xhr.onload = function() {
    if (xhr.status === 200) {
      var comments = document.getElementById('comments');
      comments.insertAdjacentHTML('beforeEnd', xhr.responseText);
    }
    else {
      console.log('Request failed.' + xhr.status);
    }
  };
  xhr.send();
}

function loadMoreReply(id, currentPage){
  xhr.open('GET', "/contents/<%=content.id%>/" + id + "/?page=" + currentPage);
  xhr.onload = function() {
    if (xhr.status === 200) {
      var replies = document.getElementById(id+'Replies');
      replies.insertAdjacentHTML('beforeEnd', xhr.responseText);
    }
    else {
      console.log('Request failed.' + xhr.status);
    }
  };
  xhr.send();

  document.getElementById(id + 'RepliesHideReplyButton').style.display = '';
}

//TEXTAREA AUTORESIZE WO JQUERY

document.addEventListener('input', function (event) {
  if (event.target.tagName.toLowerCase() !== 'textarea') return;
  autoExpand(event.target);
}, false);

var autoExpand = function (field) {

  // Reset field height
  field.style.height = 'inherit';

  // Get the computed styles for the element
  var computed = window.getComputedStyle(field);

  // Calculate the height
  var height = parseInt(computed.getPropertyValue('border-top-width'), 10)
               + parseInt(computed.getPropertyValue('padding-top'), 10)
               + field.scrollHeight
               + parseInt(computed.getPropertyValue('padding-bottom'), 10)
               + parseInt(computed.getPropertyValue('border-bottom-width'), 10);

  field.style.height = height + 'px';

};
