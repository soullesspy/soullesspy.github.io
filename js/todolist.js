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
    });

    /**
     * This method displays an error on the page.
     * @param code the status code of the HTTP response.
     * @param text error message
     */
    const showError = (code, text) => {
        console.log(text);
        let errorBar = $(".error-bar");
        errorBar.text = text;
        errorBar.removeClass("hide-bar");
        setTimeout(function () {
            errorBar.addClass('hide-bar');
        }, 5000);

    };


    /**
     * This method receives the list of tasks and calls the method to add each of them to the page
     *
     * @param array the string coming on the body of the API response
     */
    const loadTasks = (tasks) => {
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
        let newTaskInput = $("#new-task");
        let content = newTaskInput.val();
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

        newTaskInput.val("");
        return false;
    };

    /**
     * This procedure links the new task button the addTask method on the click event.
     */
    let addButtons = $('.add');
    addButtons.click((e) => {
        addTask(e);
    });

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
        let newItem = $('<li id="task-' + task.id + '"></li>');

        let label = $('<label></label>');
        if (task.status !== TASK_STATUS.CANCEL) {
            let checked = "";
            if (task.status === TASK_STATUS.DONE){
                checked = "checked";
            }
            label.html('<input type="checkbox" ' + checked+' />'+ task.description);
        } else {
            label.html(task.description);
        }
        let textEditButton = "<button class='edit' data-id='" + task.id + "'>Editar</button>";
        let editButton = $(textEditButton);
        editButton.click((e) => {
            editTask(e);
        });
        let textDeleteButton = "<button class='delete' data-id='" + task.id + "'>Borrar</button>";
        let deleteButton = $(textDeleteButton);
        deleteButton.click((e) => {
            removeTask(e);
        });
        newItem.append(label);
        newItem.append(editButton);
        newItem.append(deleteButton);
        if (task.status === TASK_STATUS.PENDING) {
            let textCancelButton = "<button class='cancel' data-id='" + task.id + "'>Cancelar</button>";
            let cancelButton = $(textCancelButton);
            cancelButton.click((e) => {
                cancelTask(e);
            });
            newItem.append(cancelButton);
        }
        if (task.status === TASK_STATUS.PENDING)
            $('#incomplete-tasks').append(newItem);
        else if (task.status === TASK_STATUS.DONE)
            $('#completed-tasks').append(newItem);
        else
            $('#canceled-tasks').append(newItem);
        if (task.status !== TASK_STATUS.CANCEL) {
            addOnChangeEvent(task);
        }
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
        let currentDOMTask = $('#task-' + id);
        currentDOMTask.find("input[type=checkbox]").remove();
        let currentTask = new Task(currentDOMTask.find("label").text().trim());
        currentTask.id = id;
        currentDOMTask.find('label').remove();
        let inputText = $("<input id='task-edit-" + id + "' type='text' value='" + currentTask.description + "' />");

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

        let buttonCancel = $('<button id="cancel-button-' + id + '">Cancel</button>');
        buttonCancel.click(function () {
            revertHTMLChangeOnEdit(currentTask)
        });
        currentDOMTask.prepend(buttonCancel);
        currentDOMTask.prepend(buttonOK);
        currentDOMTask.prepend(inputText);
        currentDOMTask.find('.edit').css("visibility", 'hidden');
        currentDOMTask.find('.delete').css("visibility", 'hidden');
        currentDOMTask.find('.cancel').css("visibility", 'hidden');

        inputText.focus();
    };

    /**
     * This method removes the form displayed to edit the task and show it as a task item.
     * @param currentTask the string coming from the API
     */
    const revertHTMLChangeOnEdit = (currentTask) => {
        let task = currentTask;
        let currentDOMTask = $('#task-' + task.id);
        $('#task-' + task.id).find('input[type=text]').remove();
        currentDOMTask.find('input[type=text]').remove();

        let label = $("<label></label>");
        currentDOMTask.prepend(label);
        label.html("<input type='checkbox'/>" + task.description);
        currentDOMTask.prepend(label);
        currentDOMTask.find('button#ok-button-'+task.id).remove();
        currentDOMTask.find('button#cancel-button-'+task.id).remove();
        currentDOMTask.find('.edit').css('visibility', 'visible');
        currentDOMTask.find('.delete').css('visibility', 'visible');
        currentDOMTask.find('.cancel').css('visibility', 'visible');
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
    /**
    * This method sends a PUT request to update the task from the server.
    * @param e
    */
   const cancelTask = (e) => {
       const id = e.target.dataset.id;
       const checkBox = document.getElementById(`task-${id}`).querySelector('label > input');
       if (!checkBox.checked) {

           $.ajax({
               method: "PUT",
               url: API_URL + "/" + id,
               data: JSON.stringify({"status": TASK_STATUS.CANCEL}),
               contentType: 'application/json'
           }).done((value) => {
               $('#task-' + id).remove();
               addTaskToList(value);
           }).fail((code) => {
               showError(code, 'La tarea no ha podido ser añadida.');
           });
       }
   };
})
(jQuery);