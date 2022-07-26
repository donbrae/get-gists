import './styles.css';
import './xcode.css';
import hljs from 'highlight.js';
import markdownit from 'markdown-it';

// https://stackoverflow.com/a/6234804
function escapeHtml(unsafe) {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function show(el) {
  el.classList.remove('hide');
  setTimeout(() => {
    el.classList.add('show');
  }, 30);
}


const cfg = {
  githubUser: 'donbrae',
  hideIds: [
    // IDs of gists to exclude from page
    '2369abb83a0f3d53fbc3aba963e80f7c', // PDF page numbers
    'bfbda44e3bb5c2883a25acc5a759c8fc', // Bootstrap 5 colour gradient
    'ab4e15be962602b1bf4975b912b14939' // Apple Music shortcuts
  ],
  perPage: 15, // Number of gists to fetch from API
  gistsLimit: 10 // Maximum number of gists to add to page
};

const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];
const urlRegEx = /(\b(https):\/\/[-A-Z0-9+&@#%?=~_|!:,.;]*[-A-Z0-9+&@#%=~_|])/gi; // Only transform https URLs. Source: https://www.codespeedy.com/replace-url-with-clickable-link-javascript/
const gists = document.getElementById('gists');

document.getElementById('get-gists').addEventListener('click', getGists);

function getGists(e) {
  const btnGetGists = e.target;
  btnGetGists.classList.add('fade');

  function error(err, container, e) {
    console.error(err);
    const escapedHTML = escapeHtml(`${err.status} ${err.statusText}: ${err.url}`);
    container.innerHTML = `<div>${err.status} ${err.statusText}: ${err.url}</div>`;
    show(container);

    const button = e.target;
    button.parentNode.removeChild(button);
  }

  fetch(
    `https://api.github.com/users/${cfg.githubUser}/gists?per_page=${cfg.perPage}`
  )
    .then(function (response) {
      if (response.ok) return response.json();

      return Promise.reject(response);
    })
    .then(function (data) {
      console.log(data);

      if (data.error) {
        console.error(data.error);
        return;
      }

      // Format each gist and add to `items`
      const items = [];
      const dataFiltered = data.filter(
        (gist) => cfg.hideIds.indexOf(gist.id) === -1
      );

      for (let i = 0; i < cfg.gistsLimit; i++) {
        if (dataFiltered[i]) {
          const date = new Date(dataFiltered[i].created_at);
          const dateFormatted = `${date.getDate()} ${
            months[date.getMonth()]
          }`;
          const verb = !i ? 'Created ' : '';
          const year = ` ’${date.getFullYear().toString().slice(-2)}`;

          let description = dataFiltered[i].description.trim().length
            ? `<div>${dataFiltered[i].description}</div>`
            : '';

          // Transform links
          description = description.replace(urlRegEx, function (match) {
            return `<a href="${match}">${match}</a>`;
          });

          // Transform `` into <code></code>
          description = description.replaceAll(/`(.+?)`/gi, function (match) {
            return `<code>${match.slice(1).slice(0, -1)}</code>`;
          });

          items.push(
            `<div class="gist-container">
              <h2><a href="${
                dataFiltered[i].html_url
              }">${
              Object.keys(dataFiltered[i].files)[0]
            }</a></h2> <span class="dt-published">${verb}${dateFormatted} ${year}</span>${description}
              <button class="get-gist display-block button button-sm mt-1" data-gist-id="${
                dataFiltered[i].id
              }">Show</button>
              <div id="gist-${dataFiltered[i].id}" class="gist-content hide fade"></div>
            </div>`
          );
        } else break;
      }

      gists.innerHTML = items.join('');
      btnGetGists.parentNode.removeChild(btnGetGists);
      show(gists);

      const getGists = document.querySelectorAll('.get-gist');
      getGists.forEach((getGistButton) => {
        getGistButton.addEventListener('click', (e) => {
          const gistId = e.target.dataset.gistId;
          const btn = e.target;
          btn.disabled = true; // Make sure only one API call is sent
          btn.classList.add('fade');

          const el = document.getElementById(`gist-${gistId}`);

          fetch(`https://api.github.com/gists/${gistId}`)
            .then(function (response) {
              if (response.ok) return response.json();

              return Promise.reject(response);
            })
            .then(function (data) {

              if (data.error) {
                console.error(data.error);
                el.innerHTML = `<div class="gist-content">${escapeHtml(data.error)}</div>`;
                btn.parentNode.removeChild(btn);
                show(el);
                return;
              }

              const gistName = Object.keys(data.files)[0];
              const gist = data.files[gistName];
              let gistContent;

              if (gist.type === 'text/html') {
                gistContent = escapeHtml(gist.content);
              } else if (gist.type === 'text/markdown') {
                const md = new markdownit('default', { html: true });
                gistContent = md.render(gist.content);
              } else {
                gistContent = gist.content;
              }

              if (gist.type === 'text/markdown') { // Markdown
                el.insertAdjacentHTML(
                  'beforeend',
                  `<div>${gistContent}</div>`
                );
              } else { // Code or plain text
                el.insertAdjacentHTML(
                  'beforeend',
                  `<pre class="code" role="code">${gistContent}</pre>`
                );
                hljs.highlightElement(el.querySelector('pre'));
              }

              btn.parentNode.removeChild(btn);
              show(el);
            })
            .catch((err) => {
              error(err, el, e);
            });
        });
      });
    })
    .catch((err) => {
      error(err, gists, e);
    });
}
