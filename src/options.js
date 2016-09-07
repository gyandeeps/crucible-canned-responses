var storageData = getAnswersListFromStorage();
var __gcrExtAnswers = storageData.answers;
var __submitOnClick = storageData.submitOnClick;
var __quickReply = storageData.quickReply;
var localStorageKey = "__CR_CANNED_ANSWERS__EXT__";

var gcrExtEditorSaveAnswers = function() {
    localStorage.setItem(localStorageKey, JSON.stringify({
        answers: __gcrExtAnswers,
        submitOnClick: __submitOnClick,
        quickReply: __quickReply
    }));
};

gcrExtEditorSetup();
gcrExtEditorUpdateAnswersList();
