<?php
require_once 'header.inc'; // Defines $opts

$cache_file = 'cached.json';

$context = stream_context_create($opts);
$content = file_get_contents('https://api.github.com/users/donbrae/gists?per_page=15', false, $context);

$status = getStatus($http_response_header);
$response_headers = getResponseHeaders($http_response_header);

writeLog('Status: ' . $status .
  ' X-RateLimit-Remaining: ' . intval($response_headers['X-RateLimit-Remaining']) .
  ' X-RateLimit-Reset: ' . gmdate('Y-m-d\TH:i:s P', intval($response_headers['X-RateLimit-Reset'])) .
  ' API method: /users/donbrae/gists');

if ($status === 200) {

  echo $content; // Serve JSON returned from API
  writeLog('Serve JSON returned from API');

  if (
    intval($response_headers['X-RateLimit-Remaining']) < 250 && // We may hit the API rate limit soon
    file_exists($cache_file) && (time() - filemtime($cache_file)) / 60 / 60 > 6 || // Cached file hasn’t been updated in last 6 hours
    !file_exists($cache_file)
  ) {
    writeFile($cache_file, $content); // Write a cached version of JSON in case API rate limit is reached
    writeLog('Write new cached copy: cached.json');
    }
} else if (file_exists($cache_file)) { // Status ?304, 403 or 422
  echo file_get_contents("cached.json"); // Serve cached copy
  writeLog('Serve cached copy: cached.json');
} else {
  echo "{\"error\": \"Cannot fetch list of gists. Error code: $status\"}";
  writeLog("Cannot fetch list of gists. Error code: $status");
}
?>
