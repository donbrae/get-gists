<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache');

$opts = [
  'http' => [
    'method' => 'GET',
    'header' => [
      'User-Agent: PHP',
      'Content-Type: application/json',
      'Accept: application/vnd.github+json',
      'Authorization: token <token>'
    ]
  ]
];

// Avoid conflicting file writes. $filename should be relative path to file
// https://softwareengineering.stackexchange.com/a/332544
function writeFile($filename, $content, $append = false) {
  $unique_tmp_filename = uniqid('', true).'.tmp'; // Create unique filename
  if ($append) {
    file_put_contents($unique_tmp_filename, file_get_contents($filename) . $content); // Concatenate contents of existing file with new content
  } else {
    file_put_contents($unique_tmp_filename, $content);
  }

  rename($unique_tmp_filename, $filename);
}

function writeLog($message) {
  writeFile('getgists.log', date('Y-m-d\TH:i:s P') . " $message\n", true);
}

// Returns array of response headers
function getResponseHeaders($http_response) {
  // https://beamtic.com/parsing-http-response-headers-php
  $response_headers = [];
  foreach ($http_response as $value) {
    if (false !== ($matches = explode(':', $value, 2))) {
      $response_headers["{$matches[0]}"] = trim($matches[1]);
    }
  }
  return $response_headers;
}

// Returns status as interger
function getStatus($http_response) {
  // https://stackoverflow.com/a/52662522/4667710
  $status_message = array_shift($http_response);
  preg_match('{HTTP\/\S*\s(\d{3})}', $status_message, $match);
  $status = intval($match[1]);
  return $status;
}
?>
