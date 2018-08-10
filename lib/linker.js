    // Паттерн ссылок для парсинга коммитов:
    // Например: "jira.site.com"
    jira_link_pattern = "jira.site.com";

    // Полный URL API Jira, откуда получать названия задач
    // Например: "https://jira.site.com/rest/api/latest/issue/"
    jira_api_url = "https://jira.site.com/rest/api/latest/issue/";

    // Path страницы сравнения в Github
    github_compare_path = "/compare/";

    // Функция вывода плашки с ссылками на задачи при сравнении версий веток гемов
if (document.location.pathname.includes(github_compare_path)) {
    tasks = {};                                 // Хэш для задач из Jira
    issues = [];                                // Массив кодов задач
    links = grabJiraLinks('.commit-desc a');    // Массив для ссылок

    grabTasksNameToHash(links);

    var main_block_element = document.createElement('div');
    var text_area_element = document.createElement('textarea');
    var copy_button = document.createElement('button');
    var copy_checkbox_label = document.createElement('label');
    var copy_checkbox = document.createElement('input');

    // Создали плашку
    main_block_element.style = `border: 1px solid rgb(223, 226, 229);
                                z-index: 10000;
                                top: 165px;
                                left: 5px;
                                width: 265px;
                                display: inline-block;
                                height: 275px;
                                position: fixed !important;`;

    // Создали текстовое поле с ссылками
    text_area_element.style = `width: 250px; 
                               height: 230px; 
                               margin: 5px 5px 0px 5px; 
                               resize: none; 
                               overflow-y: scroll; 
                               font-size: 12px;`;

    // Создали кнопку для копирования
    copy_button.style = "margin-left: 5px;";
    copy_button.innerHTML = "Копировать";
    copy_button.className = "btn btn-sm btn-primary";
    copy_button.onclick = copyToClipboard;

    // Создали чекбокс с обёрткой для копирования в формате Jira
    copy_checkbox.setAttribute("type", "checkbox");
    copy_checkbox.setAttribute("checked", "true");
    copy_checkbox.style = `margin-left: 8px; 
                           vertical-align: middle;`;

    copy_checkbox_label.className = "text-green";
    copy_checkbox_label.style = `float: right;
                                 margin-right: 10px;`;
    copy_checkbox_label.innerHTML = "Формат Jira";
    copy_checkbox_label.title = 'Опция используется при копировании списка задач';

    // Добавили чекбокс в блок с названием опции
    copy_checkbox_label.appendChild(copy_checkbox);

    // Заполнили поле ссылками
    text_area_element.innerHTML = links.join("\r\n");

    // Добавили текстовое поле в плашку
    main_block_element.appendChild(text_area_element);

    // Добавили кнопку в плашку
    main_block_element.appendChild(copy_button);

    // Добавили чекбокс в плашку
    main_block_element.appendChild(copy_checkbox_label);

    // Добавили плашку на страницу
    document.body.appendChild(main_block_element);
}

function grabJiraLinks(selector) {
    var
        links_elements = document.querySelectorAll(selector);
        links_array = [];

    // Заполнили массив
    for (var i = 0; i < links_elements.length; i++) {
        links_array.push(links_elements[i].href);
    }

    // Сделали его уникальным
    links_array = Array.from(new Set(links_array));

    // Оставили только ссылки на таски в Jira
    links_array = links_array.filter(function (item) {
        return item.includes(jira_link_pattern);
    });

    return links_array;
}

function copyToClipboard() {
    var tmp = text_area_element.innerHTML;

    if (copy_checkbox.checked) {
        text_area_element.innerText = getJiraFormat();
    }

    text_area_element.select();
    document.execCommand('copy');
    text_area_element.innerHTML = tmp;
    text_area_element.blur();
}

function getJiraFormat() {
  var jira_format = document.location.href + "\r\n";

  // Заполняем задачи
  for (var i = 0; i < Object.keys(tasks).length; i++) {
    var task = tasks[Object.keys(tasks)[i]];
      jira_format = jira_format + "- [" + task.name + "|" + task.url + "]" + "\r\n";
  }

  return jira_format;
}

function grabTasksNameToHash(urls) {
  var
    xhr = new XMLHttpRequest();

    for (var i = 0; i < urls.length; i++) {
      issues.push(getTaskFromUrl(urls[i]))
    }

    for (var i = 0; i < issues.length; i++) {
        xhr.open("GET", jira_api_url + issues[i], false);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) { // Когда запрос успешно завершился
                tasks[issues[i]] = {
                    name: (JSON.parse(xhr.responseText).fields.summary),
                    url: urls[i]
                };
            }
        };
        xhr.send();
    }
}

function getTaskFromUrl(url) {
  return url.split('/browse/')[1];
}

// Замена названия ветки автора Pull Request'a на ссылку в ветку форка автора из которой был отправлен PR.
if (document.location.pathname.includes('/pull/')) {

    var head_user = document.querySelectorAll('.head-ref .css-truncate-target')[0].innerText;
    var head_branch = document.querySelectorAll('.head-ref .css-truncate-target')[1].innerText;
    var repo_name = document.querySelectorAll('strong[itemprop="name"]')[0].innerText;
    var head_url = "https://github.com/" + head_user + "/" + repo_name + "/tree/" + head_branch;

    replace_node('.head-ref', 'a');
    set_node_url('.head-ref', head_url);

    function replace_node(source_selector, type_new_node) {
        var source = document.querySelector(source_selector);
        var new_node = document.createElement(type_new_node);
        new_node.title = source.title;
        new_node.innerHTML = source.innerHTML;
        new_node.classList = source.classList;

        source.parentNode.replaceChild(new_node, source);
    }

    function set_node_url(node, url) {
        document.querySelector(node).setAttribute('href', url);
    }
}
