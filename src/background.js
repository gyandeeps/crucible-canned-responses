var defaultAnswers = [
    {
        name: "+1",
        description: "+1"
    },
    {
        name: "LGTM",
        description: "Looks good to me."
    }
];

var defaultData = {
    answers: defaultAnswers,
    submitOnClick: false
};

function getAnswersListFromStorage(){
    // Load the answers from local storage.
    var localStorageKey = "__CR_CANNED_ANSWERS__EXT__";
    var saved = localStorage.getItem(localStorageKey);
    var data;

    if(!saved || saved === ""){
        localStorage.setItem(localStorageKey, JSON.stringify(defaultData));
        data = defaultData;
    }
    else{
        data = JSON.parse(localStorage.getItem(localStorageKey));
    }
    return data;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if(request.action === "load"){
        var data = getAnswersListFromStorage();
        sendResponse({
            "answers": data.answers,
            "submitOnClick": data.submitOnClick
        });
    }
    if(request.action === "save"){
        // Save the answers to local storage.
        var localStorageKey = "__CR_CANNED_ANSWERS__EXT__";
        localStorage.setItem(localStorageKey, JSON.stringify({
            "answers": request.answers,
            "submitOnClick": request.submitOnClick
        }));
        sendResponse();
    }
});
