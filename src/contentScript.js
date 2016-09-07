var __gcrExtAnswers;
var __submitOnClick = false;
var __quickReply = {};

(function(){
    "use strict";

    var allowedPaths = [
        // New pull request
        /crucible\/[\w\-]+\/[\w\-]+\/viewer/
    ];

    // Inject the code from fn into the page, in an IIFE.
    function inject(fn){
        var script = document.createElement('script');
        var parent = document.documentElement;
        script.textContent = '(' + fn + ')();';
        parent.appendChild(script);
        parent.removeChild(script);
    }

    // Post a message whenever history.pushState is called. GitHub uses
    // pushState to implement page transitions without full page loads.
    // This needs to be injected because content scripts run in a sandbox.
    inject(function(){
        var pushState = history.pushState;
        history.pushState = function on_pushState(){
            window.postMessage('extension:pageUpdated', '*');
            return pushState.apply(this, arguments);
        };
        var replaceState = history.replaceState;
        history.replaceState = function on_replaceState(){
            window.postMessage('extension:pageUpdated', '*');
            return replaceState.apply(this, arguments);
        };
    });

    // Do something when the extension is loaded into the page,
    // and whenever we push/pop new pages.
    window.addEventListener("message", function(event){
        if(event.data === 'extension:pageUpdated'){
            addAnswerButton();
        }
    });

    window.addEventListener("popstate", load);
    load();

    // End of code from https://github.com/thieman/github-selfies/blob/master/chrome/selfie.js

    function load(){
        chrome.runtime.sendMessage({action: 'load'}, function(response){
            __gcrExtAnswers = response.answers;
            __submitOnClick = response.submitOnClick;
            __quickReply = response.quickReply;
            addAnswerButton();
        });
    }

    function any(array, predicate){
        for(var i = 0; i < array.length; i++){
            if(predicate(array[i])){
                return true;
            }
        }
        return false;
    }

    function addAnswerButton(){
        var targets = document.querySelectorAll('.change_body.frxinner');

        function insertButton(event){
            // If there's already a button nuke it so we can start fresh.
            var existingButtons = document.querySelectorAll('.crucible-canned-response-item');
            if(existingButtons && existingButtons.length !== 0){
                for(var i = 0; i < existingButtons.length; i++){
                    existingButtons[i].parentNode.removeChild(existingButtons[i]);
                }
            }

            var commentForms = this.querySelectorAll('.commentForm');

            for(var i = 0; i < commentForms.length; i++){
                var buttonSection = commentForms[i].querySelector(".wiki-buttons");

                if(!buttonSection){
                    continue;
                }

                var target = createNodeWithClass('div', 'toolbar-group crucible-canned-response-item');
                buttonSection.insertBefore(target, buttonSection.childNodes[0]);

                var item = createNodeWithClass('div', 'select-menu select-menu-modal-right js-menu-container js-select-menu label-select-menu');
                target.appendChild(item);

                var button = createButton();
                item.appendChild(button);

                button.addEventListener("click", function(e){
                    this.parentNode.classList.toggle("active");

                    if(!this.parentNode.querySelector(".select-menu-modal-holder.js-menu-content")){
                        var dropdown = createDropdown(__gcrExtAnswers, buttonSection);
                        this.parentNode.appendChild(dropdown);
                    }
                    e.stopImmediatePropagation();
                });
            }
        }


        var observer = new MutationObserver(function(mutations, observer) {
            mutations.forEach(function(mut){
                if (mut.addedNodes.length > 0) {
                    addQuickReply(mut.target);
                }
            });
        });

        for(var i = 0; i < targets.length; i++){
            observer.observe(targets[i], {
                childList: true
            });
            targets[i].removeEventListener('click', insertButton);
            targets[i].addEventListener('click', insertButton);
        }
    }

    function fireClick(node){
        if (document.createEvent) {
            var evt = document.createEvent('MouseEvents');
            evt.initEvent('click', true, false);
            node.dispatchEvent(evt);
        } else if (document.createEventObject) {
            node.fireEvent('onclick') ;
        } else if (typeof node.onclick == 'function') {
            node.onclick();
        }
    }

    function createQuickReplyDom(name, description) {
        var elem = createNodeWithClass("a", "");

        elem.innerText = name;
        elem.onclick = function(){
            fireClick(this.parentElement.parentElement.children[0].children[0]);
            document.getElementById("replyCommentForm").querySelector(".commentTextarea").value = description;
            document.getElementById("replyCommentForm").querySelector('.aui-button.aui-button-primary.postButton.defaultButton').click();
        };

        var liElem = createNodeWithClass("li", "");
        liElem.appendChild(elem);

        return liElem;
    }

    function addQuickReply(target) {
        var commentBlocks = target.querySelectorAll(".comment-container");

        commentBlocks.forEach(function(commentBlock) {
            if (commentBlock.querySelector(".comment-actions-inner")) {
                Object.keys(__quickReply).forEach(function(key) {
                    commentBlock.querySelector(".comment-actions-inner").appendChild(createQuickReplyDom(key, __quickReply[key]));
                });
            }
        });
    }

    function createNodeWithClass(nodeType, className, text){
        var element = document.createElement(nodeType);
        element.className = className;
        return element;
    }

    function createButton(){
        var button = createNodeWithClass('button', 'toolbar-item tooltipped tooltipped-n js-menu-target menu-target');

        button.setAttribute('aria-label', 'Insert canned response');
        button.style.display = 'inline-block';
        button.type = 'button';

        // Github just shipped svg icons!
        var svg = createSVG(18, 16, 'octicon-mail-read', "M6 5H4v-1h2v1z m3 1H4v1h5v-1z m5-0.48v8.48c0 0.55-0.45 1-1 1H1c-0.55 0-1-0.45-1-1V5.52c0-0.33 0.16-0.63 0.42-0.81l1.58-1.13v-0.58c0-0.55 0.45-1 1-1h1.2L7 0l2.8 2h1.2c0.55 0 1 0.45 1 1v0.58l1.58 1.13c0.27 0.19 0.42 0.48 0.42 0.81zM3 7.5l4 2.5 4-2.5V3H3v4.5zM1 13.5l4.5-3L1 7.5v6z m11 0.5L7 11 2 14h10z m1-6.5L8.5 10.5l4.5 3V7.5z");
        button.appendChild(svg);
        var span = createNodeWithClass('span', 'dropdown-caret');
        button.appendChild(span);

        return button;
    }

    function createDropdown(answers, toolbar){
        // This should use the fuzzy search instead (see labels)
        var outer = createNodeWithClass('div', 'select-menu-modal-holder js-menu-content js-navigation-container');
        var inner = createNodeWithClass('div', 'select-menu-modal');
        outer.appendChild(inner);

        var header = createNodeWithClass('div', 'select-menu-header');
        var headerSpan = createNodeWithClass('span', 'select-menu-title');
        var spanText = document.createElement('text');
        spanText.innerHTML = 'Canned responses ';

        var editButton = createNodeWithClass('button', 'btn-link github-canned-response-edit');
        editButton.type = 'button';
        editButton.innerHTML = '(edit or add new)';
        editButton.addEventListener('click', showEditView);

        headerSpan.appendChild(spanText);
        headerSpan.appendChild(editButton);
        header.appendChild(headerSpan);
        inner.appendChild(header);

        var main = createNodeWithClass('div', 'js-select-menu-deferred-content');
        inner.appendChild(main);
        var itemList = createNodeWithClass('div', 'select-menu-list');

        main.appendChild(itemList);

        for(var i = 0; i < answers.length; i++){
            var item = createDropdownItem(answers[i].name);
            itemList.appendChild(item);
            item.toolbar = toolbar;
            item.answer = answers[i].description;
            item.addEventListener('click', insertAnswer);
        }

        return outer;
    }

    function createDropdownItem(text){
        var item = createNodeWithClass('div', 'select-menu-item js-navigation-item');
        item.textContent = text;
        return item;
    }

    function createSVG(height, width, octiconName, octiconPath){
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'octicon ' + octiconName);
        svg.style.height = height + 'px';
        svg.style.width = width + 'px';
        svg.setAttribute('viewBox', '0 0 ' + height + ' ' + width);

        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttributeNS(null, 'd', octiconPath);
        svg.appendChild(path);

        return svg;
    }

    function insertAnswer(event){
        var item = event.target;
        var textarea = item.toolbar.parentNode.parentNode.querySelector('textarea');
        textarea.value += item.answer + '\n';

        // Scroll down.
        textarea.focus();
        textarea.scrollTop = textarea.scrollHeight;

        // trigger click on comment if preference is set
        if(__submitOnClick){
            item.toolbar.parentNode.querySelector('.aui-button.aui-button-primary.postButton.defaultButton').click();
        }
    }

    function showEditView(){

        var dialog = createNodeWithClass('div', 'gcr-ext-editor-dialog');
        dialog.id = 'gcr-ext-editor';

        // lol. This is from options.html.
        // TODO: Replace this with ES6 civilized strings when you're less scared
        // about breaking everything.
        dialog.innerHTML = '<div class="gcr-ext-editor-close"></div>' +
            '<div class="gcr-ext-editor-dialog-inner">' +
                '<div class="gcr-ext-editor-header"> ' +
                    '<div class="gcr-ext-editor-horizontal"> ' +
                        '<div> ' +
                            '<input id="gcrExtNewTitle" class="gcr-ext-editor-answer-title gcr-ext-editor-answer-half" placeholder="You go get \'em tiger!"> ' +
                            '<textarea id="gcrExtNewText" class="gcr-ext-editor-answer-text gcr-ext-editor-answer-half" style="height: 100px" placeholder="You\'re the best! Also, we\'re closing this PR because it\'s written wrong, but <333"></textarea> ' +
                        '</div> ' +
                    '<div> ' +
                        '<div class="gcr-ext-editor-answer-text" style="font-size: 14px">' +
                            '<span class="gcr-ext-editor-pink">⇠</span> ' +
                            'This is an easy title to remember this canned response by</div>' +
                            '<br> ' +
                            '<div class="gcr-ext-editor-answer-text" style="font-size: 14px">' +
                                '<span class="gcr-ext-editor-pink">⇠</span> ' +
                                'And this is the actual content that will be inserted' +
                            '</div>' +
                            '<br> ' +
                            '<button id="gcrExtNewButton" class="btn btn-sm btn-primary">Can it!</button> ' +
                            '<span id="gcrExtNewError" class="gcr-ext-editor-status-message" hidden>No empty canned responses!</span> ' +
                            '<span id="gcrExtNewConfirm" class="gcr-ext-editor-status-message" hidden>Added!</span> ' +
                        '</div> ' +
                    '</div> ' +
                    '<div> ' +
                        '<input type="checkbox" class="checkbox" name="gcr-auto-submit" id="gcr-auto-submit" value="false"> ' +
                        '<label title="Auto submit when canned response is clicked" for="gcr-auto-submit">Auto submit when canned response is clicked</label>' +
                    '</div> ' +
                '</div> ' +
            '<div class="gcr-ext-editor-list"> ' +
                '<ul id="gcrExtAnswerList"></ul> ' +
            '</div>' +
            '</div>';

        var closeBar = dialog.querySelector('.gcr-ext-editor-close');

        var closeText = createNodeWithClass('span', 'select-menu-title');
        closeText.innerHTML = 'Edit or add canned responses';
        closeText.style.float = 'left';
        closeText.style.padding = '5px 10px';
        closeText.style.color = 'black';
        closeText.style.fontWeight = 'bold';

        var closeButton = createNodeWithClass('button', 'btn-link delete-button');
        closeButton.type = 'button';
        closeButton.style.padding = '5px 10px';
        closeButton.style.float = 'right';
        var svg = createSVG(16, 16, 'octicon-x', 'M7.48 8l3.75 3.75-1.48 1.48-3.75-3.75-3.75 3.75-1.48-1.48 3.75-3.75L0.77 4.25l1.48-1.48 3.75 3.75 3.75-3.75 1.48 1.48-3.75 3.75z');
        closeButton.appendChild(svg);
        closeButton.addEventListener('click', function(){
            document.body.removeChild(dialog);
        });

        closeBar.appendChild(closeText);
        closeBar.appendChild(closeButton);
        document.body.appendChild(dialog);

        window.gcrExtEditorSaveAnswers = function(){
            chrome.runtime.sendMessage(
                {
                    action: 'save',
                    answers: __gcrExtAnswers,
                    submitOnClick: __submitOnClick,
                    quickReply: __quickReply
                },
                function(response){
                    addAnswerButton();
                }
            );
        };

        gcrExtEditorSetup();
        gcrExtEditorUpdateAnswersList();
    }
})();
