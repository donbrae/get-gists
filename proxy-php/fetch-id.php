<?php
require_once 'header.inc'; // Defines $opts

$gist_id = $_GET['gist_id'];
$cached_file_path = "./gistscache/$gist_id.json";
$cached_file_exists = file_exists($cached_file_path);

if ($cached_file_exists) {
  // Get last updated date of file in GMT
  $last_modified = filemtime($cached_file_path); // Get its last modified date
  $last_modified_gmt = gmdate('D, d M Y H:i:s', $last_modified) . ' GMT'; // Format it so GitHub API accepts it in header

  // Add date to header so that API will return 304 if no updates have been made, and we can serve the cached copy; otherwise we can expect a 200 with the latest data
  array_push($opts['http']['header'], "If-Modified-Since: $last_modified_gmt");
}

$context = stream_context_create($opts);
$content = file_get_contents("https://api.github.com/gists/$gist_id", false, $context);

$status = getStatus($http_response_header);
$response_headers = getResponseHeaders($http_response_header);

writeLog('Status: ' . $status .
  ' X-RateLimit-Remaining: ' . intval($response_headers['X-RateLimit-Remaining']) .
  ' X-RateLimit-Reset: ' . gmdate('Y-m-d\TH:i:s P', intval($response_headers['X-RateLimit-Reset'])) .
  ' API method: /gists' .
  " Cached file exists: $cached_file_exists");

if ($status === 200) {
  echo $content; // Serve JSON returned from API
  writeFile($cached_file_path, $content); // Add/update cached copy
  writeLog("Serve JSON returned from API; write cached copy: $cached_file_path");
} else if (
  $status === 304 && $cached_file_exists || // Not modified and we have a cached version
  $status === 403 && $cached_file_exists // We've likely reached our API limit (403 == Forbidden Gist in the API docs, and in my testing the API returns 403 when we go over our limit)
) {
  echo file_get_contents($cached_file_path); // Serve cached copy
  writeLog("Serve cached copy: $cached_file_path");
} else {
  echo "{\"error\": \"Cannot fetch gist. Error code: $status\"}";
  writeLog("Cannot fetch gist. Error code: $status");
}

?>
