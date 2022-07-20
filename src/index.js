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

const cfg = {
  githubUser: 'donbrae',
  hideIds: [
    // IDs of Gists to exclude from page
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

function getGists() {
  fetch(
    `https://api.github.com/users/${cfg.githubUser}/gists?per_page=${cfg.perPage}`
  )
    .then(function (response) {
      if (response.ok) return response.json();

      return Promise.reject(response);
    })
    .then(function (data) {
      console.log(data);

      // Format each Gists and add to `items`
      function addToUI() {
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
              `<div>
                <a href="${
                  dataFiltered[i].html_url
                }"><h3 class="h5 display-inline">${
                Object.keys(dataFiltered[i].files)[0]
              }</h3></a> <span class="dt-published post-meta date-nudge">${verb}${dateFormatted} ${year}</span>${description}
                <button class="get-gist display-block button button-sm mt-1" data-gist-id="${
                  dataFiltered[i].id
                }">Show</button>
                <div id="gist-${dataFiltered[i].id}" class="gist-content"></div>
              </div>`
            );
          } else break;
        }

        gists.innerHTML = items.join('');

        const getGists = document.querySelectorAll('.get-gist');
        getGists.forEach((getGistButton) => {
          getGistButton.addEventListener('click', (e) => {
            const gistId = e.target.dataset.gistId;
            const btn = e.target;
            btn.disabled = true; // Make sure only one API call is sent

            const el = document.getElementById(`gist-${gistId}`);

            fetch(`https://api.github.com/gists/${gistId}`)
              .then(function (response) {
                if (response.ok) return response.json();

                return Promise.reject(response);
              })
              .then(function (data) {
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

                if (gist.type !== 'text/markdown') {
                  el.insertAdjacentHTML(
                    'beforeend',
                    `<pre class="code" role="code">${gistContent}</pre>`
                  );
                  hljs.highlightElement(el.querySelector('pre'));
                } else {
                  // Markdown
                  el.insertAdjacentHTML(
                    'beforeend',
                    `<div>${gistContent}</div>`
                  );
                }

                el.classList.remove('hide');
                btn.parentNode.removeChild(btn);
              })
              .catch(function (err) {
                console.error(err);
                el.innerText = `${err.status} ${err.statusText}: ${err.url}`;
              });
          });
        });
      }

      addToUI();
    })
    .catch(function (err) {
      console.error(err);
      gists.innerText = `${err.status} ${err.statusText}: ${err.url}`;
    });
}
