function gcrExtEditorUpdateAnswersList(){
    list.innerHTML = "";
    for(var i = 0; i < __gcrExtAnswers.length; i++){
        var li = gcrExtEditorCreateItem(__gcrExtAnswers[i].name, __gcrExtAnswers[i].description, __quickReply[__gcrExtAnswers[i].name]);
        li.answerId = i;
        list.appendChild(li);
    }
}

function gcrExtEditorSetup(){
    list = document.getElementById("gcrExtAnswerList");

    document.querySelector("#gcr-auto-submit").checked = __submitOnClick;

    document.querySelector("#gcrExtNewButton").addEventListener("click", function(event){
        var name = document.getElementById("gcrExtNewTitle").value;
        var text = document.getElementById("gcrExtNewText").value;

        if(name.trim() === "" || text.trim() === ""){
            document.querySelector("#gcrExtNewConfirm").hidden = true;
            document.querySelector("#gcrExtNewError").hidden = false;
            return;
        }

        document.querySelector("#gcrExtNewConfirm").hidden = true;
        document.querySelector("#gcrExtNewError").hidden = true;

        var answerId = __gcrExtAnswers.length;
        __gcrExtAnswers.push({name: name, description: text});

        // Save to local storage.
        gcrExtEditorSaveAnswers();

        // Add to the UI list.
        var li = gcrExtEditorCreateItem(name, text);
        li.answerId = answerId;
        list.appendChild(li);

        document.querySelector("#gcrExtNewConfirm").hidden = false;
        document.getElementById("gcrExtNewTitle").value = "";
        document.getElementById("gcrExtNewText").value = "";

        // Clear it after a bit.
        setTimeout(function(){
            document.querySelector("#gcrExtNewConfirm").hidden = true;
        }, 2000);
    });

    document.querySelector(".gcr-ext-editor-list").addEventListener("click", function(event){
        var target = null;

        if(event.target.classList.contains("quick-reply")) {
            target = event.target.parentNode;
        }
        else if(event.target.tagName.toLowerCase() !== "button") {
            return;
        }
        else {
            target = event.target;
        }

        var item = target.parentNode;
        var title = item.querySelector(".gcr-ext-editor-answer-title");
        var text = item.querySelector(".gcr-ext-editor-answer-text");

        // This is pretty lame.
        if(target.textContent.toLowerCase() === "edit"){
            title.disabled = text.disabled = false;
            target.textContent = "Save";
            title.focus();
        }
        else if(target.textContent.toLowerCase() === "save"){
            title.disabled = text.disabled = true;
            target.textContent = "Edit";

            // Save locally.
            var answerId = item.answerId;

            if (__quickReply[__gcrExtAnswers[item.answerId].name]) {
                delete __quickReply[__gcrExtAnswers[item.answerId].name];
                __quickReply[title.value] = text.value;
            }

            __gcrExtAnswers[item.answerId].name = title.value;
            __gcrExtAnswers[item.answerId].description = text.value;

            // Save to local storage.
            gcrExtEditorSaveAnswers();
        }
        else if(target.textContent.toLowerCase() === "delete"){
            __gcrExtAnswers.splice(item.answerId, 1);
            delete __quickReply[title.value];

            // Save to local storage.
            gcrExtEditorSaveAnswers();
            gcrExtEditorUpdateAnswersList();
        }
        else if(event.target.classList.contains("quick-reply")) {
            var checkbox = event.target;

            if (event.target.type === "LABEL") {
                checkbox = event.target.previousSibling;
            }

            if (checkbox.checked) {
                __quickReply[title.value] = text.value;
            }
            else {
                delete __quickReply[title.value];
            }

            // Save to local storage.
            gcrExtEditorSaveAnswers();
            gcrExtEditorUpdateAnswersList();
        }
    });

    document.querySelector("#gcr-auto-submit").addEventListener("click", function(event){
        __submitOnClick = this.checked;
        // Save to local storage.
        gcrExtEditorSaveAnswers();
    });
}

function gcrExtEditorCreateItem(name, text, isQuickReply){
    var li = document.createElement("li");

    var title = document.createElement("input");
    title.className = "gcr-ext-editor-answer-title gcr-ext-editor-single-line";
    title.value = name;
    title.disabled = true;

    var desc = document.createElement("textarea");
    desc.className = "gcr-ext-editor-answer-text";
    desc.textContent = text;
    desc.disabled = true;

    var edit = document.createElement("button");
    edit.className = "btn btn-sm btn-primary";
    edit.textContent = "Edit";

    var del = document.createElement("button");
    del.className = "btn btn-sm";
    del.textContent = "Delete";
    del.style.marginLeft = "10px";

    var quickReply = document.createElement("div");
    quickReply.className = "btn btn-sm";
    quickReply.innerHTML =
        "<input type='checkbox' id='quick-reply-" + name + "' class='quick-reply quick-reply-check' " + (isQuickReply ? "checked" : "") + "></input>" +
        "<label class='quick-reply quick-reply-label' for='quick-reply-" + name + "'>Quick reply</label>";
    quickReply.style.marginLeft = "10px";
    quickReply.style.display = "inline-block";


    li.appendChild(title);
    li.appendChild(desc);
    li.appendChild(edit);
    li.appendChild(del);
    li.appendChild(quickReply);
    return li;
}
