/**
 *
 *
 * @author carpincho
 * @since 04/03/19.
 * @version 1.0
 */
(($) => {
    'use strict';

    const API_URL = 'https://task-backend-fpuna.herokuapp.com/tasks';
    const TASK_STATUS = {
        PENDING: 'PENDIENTE',
        DONE: 'TERMINADO'
    };

    class Task {
        constructor(description) {
            this.id = null;
            this.description = description;
            this.status = TASK_STATUS.PENDING;
            this.date = new Date().toUTCString();
        }
    }

    /**
     * This method is executed once the page have just been loaded and call the service to retrieve the
     * list of tasks
     */
    $(document).on('readystatechange', () => {
        $.get(API_URL).done(function (data) {
            loadTasks(data);
        }).fail((code) => {
            showError(code, 'La tarea no ha podido ser añadida.');
        });
        // Ajax.sendGetRequest(API_URL, null, MediaFormat.JSON, (value) => loadTasks(value), (code) => showError(code, 'La tarea no ha podido ser añadida.'), true);
    });

    /**
     * This method displays an error on the page.
     * @param code the status code of the HTTP response.
     * @param text error message
     */
    const showError = (code, text) => {
        console.log(text);
        let errorBar = document.getElementsByClassName("error-bar")[0];
        errorBar.innerText = text;
        errorBar.classList.remove("hide-bar");
        setTimeout(function () {
            errorBar.classList.add("hide-bar");
        }, 5000);
    };


    /**
     * This method receives the list of tasks and calls the method to add each of them to the page
     *
     * @param array the string coming on the body of the API response
     */
    const loadTasks = (array) => {

        let tasks = JSON.parse(array);
        for (let i in tasks) {
            if (tasks.hasOwnProperty(i)) {
                addTaskToList(tasks[i]);
            }
        }
    };

    /**
     * Send the request to the API to create a new task
     *
     * @param e the event from the click on the new item button
     * @return {boolean}
     */
    const addTask = (e) => {
        let newTaskInput = document.getElementById("new-task");
        let content = newTaskInput.value;
        if (content.length === 0) return false;

        e.preventDefault();

        let task = new Task(content);

        $.ajax({
            method: "POST",
            url: API_URL,
            data: JSON.stringify(task),
            contentType: 'application/json'
        }).done((value) => {
            addTaskToList(value);
        }).fail((code) => {
            console.log(code);
            showError(code, 'La tarea no ha podido ser añadida.');
        });

        document.getElementById('new-task').value="";
        return false;
    };

    /**
     * This procedure links the new task button the addTask method on the click event.
     */
    let addButtons = document.getElementsByClassName('add');
    for (let i in addButtons)
        addButtons.item(Number(i)).onclick =  (e) => addTask(e);

    /**
     * We associate a function to manipulate the DOM once the checkbox value is changed.
     * Change the task to the completed or incomplete list (according to the status)
     */
    const addOnChangeEvent = (task) => {
        const checkBox = $('#task-' + task.id).find('label').find('input');

        checkBox.click(function () {
            console.log($(this).prop("checked"));
            if ($(this).prop("checked")) {
                task.status = TASK_STATUS.DONE;
            }else{
                task.status = TASK_STATUS.PENDING;
            }
            $('#task-' + task.id).remove();
            $.ajax({
                method: "PUT",
                url: API_URL + "/" + task.id,
                data: JSON.stringify(task),
                contentType: 'application/json'
            }).done((value) => {
                addTaskToList(value);

            }).fail((code) => {
                showError(code, 'La tarea no ha podido ser actualizada.');
            });
        });
    };

    /**
     * This method modifies the DOM HTML to add new items to the task list.
     * @param task the new task.
     */
    const addTaskToList = (task) => {
        let newItem = document.createElement('li');
        newItem.setAttribute('id', `task-${task.id}`);

        let label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" ${task.status === TASK_STATUS.DONE ? "checked" : ""}/> ${task.description}`;

        let editButton = document.createElement('button');
        editButton.innerText = 'Editar';
        editButton.classList.add('edit');
        editButton.setAttribute('data-id', task.id);
        editButton.onclick = (e) => editTask(e);

        let deleteButton = document.createElement('button');
        deleteButton.innerText = 'Borrar';
        deleteButton.classList.add('delete');
        deleteButton.setAttribute('data-id', task.id);
        deleteButton.onclick = (e) => removeTask(e);

        newItem.appendChild(label);
        newItem.appendChild(editButton);
        newItem.appendChild(deleteButton);

        if (task.status  === TASK_STATUS.PENDING)
            document.getElementById('incomplete-tasks').appendChild(newItem);
        else
            document.getElementById('completed-tasks').appendChild(newItem);

        addOnChangeEvent(task);
    };

    /**
     * This method modifies the DOM HTML to display a form that allow the user to change the
     * task description and send a PUT request to modify it on the server side
     *
     * @param e
     */
    const editTask = (e) => {
        // We retrieve the value of the attribute data-id;
        const id = e.target.dataset.id;

        let currentDOMTask = document.getElementById(`task-${id}`);
        currentDOMTask.querySelector("label > input[type=checkbox]").remove();

        let currentTask = new Task(currentDOMTask.querySelector("label").innerHTML.trim());
        currentTask.id = id;

        currentDOMTask.querySelector('label').remove();

        let inputText = document.createElement('input');
        inputText.setAttribute('id', `task-edit-${currentTask.id}`);
        inputText.setAttribute('type', 'text');
        inputText.setAttribute('value', currentTask.description);

        /**
         * We associate the event click on the button ok, to send a PUT request to the server.
         */
        let buttonOK = $('<button id="ok-button-' + id + '">OK</button>');
        buttonOK.click((e) => {
            currentTask.description = $('#task-edit-' + id).val();
            $.ajax({
                method: "PUT",
                url: API_URL + "/" + currentTask.id,
                data: JSON.stringify(currentTask),
                contentType: 'application/json'
            }).done((value) => {
                revertHTMLChangeOnEdit(value);
            }).fail((code) => {
                showError(code, 'La tarea no ha podido ser actualizada.');
            });

        });

        let buttonCancel = document.createElement('button');
        buttonCancel.innerText = 'Cancel';
        buttonCancel.setAttribute('id', `cancel-button-${currentTask.id}`);
        buttonCancel.onclick = () => revertHTMLChangeOnEdit(JSON.stringify(currentTask));

        currentDOMTask.insertBefore(buttonCancel, currentDOMTask.children[0]);
        currentDOMTask.insertBefore(buttonOK, currentDOMTask.children[0]);
        currentDOMTask.insertBefore(inputText, currentDOMTask.children[0]);

        currentDOMTask.querySelector('.edit').style.visibility = 'hidden';
        currentDOMTask.querySelector('.delete').style.visibility = 'hidden';

        inputText.focus();
    };

    /**
     * This method removes the form displayed to edit the task and show it as a task item.
     * @param currentTask the string coming from the API
     */
    const revertHTMLChangeOnEdit = (currentTask) => {
        let task = JSON.parse(currentTask);

        let currentDOMTask = document.getElementById(`task-${task.id}`);
        currentDOMTask.querySelector('input[type=text]').remove();

        let label = document.createElement('label');

        currentDOMTask.insertBefore(label, currentDOMTask.children[0]);
        label.innerHTML = `<input type="checkbox"/> ${task.description}`;
        addOnChangeEvent(task);

        currentDOMTask.insertBefore(label, currentDOMTask.children[0]);
        currentDOMTask.querySelector(`button#ok-button-${task.id}`).remove();
        currentDOMTask.querySelector(`button#cancel-button-${task.id}`).remove();

        currentDOMTask.querySelector('.edit').style.visibility = 'visible';
        currentDOMTask.querySelector('.delete').style.visibility = 'visible';
    };

    /**
     * This methods removes the task item associated to the DOM of the page
     * @param id the identifier from the task
     */
    const removeTaskFromList = (id) => {
        $('#task-' + id).remove();
    };

    /**
     * This method sends a DELETE request to remove the task from the server.
     * @param e
     */
    const removeTask = (e) => {
        const id = e.target.dataset.id;
        $.ajax({
            method: "DELETE",
            url: API_URL + '/' + id
        }).done((value) => {
            removeTaskFromList(id);
        }).fail((code) => {
            showError(code, 'La tarea no ha podido ser añadida.');
        });
    };
})(jQuery);
