<?php
// api.php - minimal progress saver for gesture tutor

header('Content-Type: application/json');

$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => "Invalid JSON"]);
  exit;
}

$mode = $data["mode"] ?? "Unknown";
$score = (int)($data["score"] ?? 0);
$total = (int)($data["total"] ?? 0);

$progressFile = __DIR__ . "/progress.json";

if (!file_exists($progressFile)) {
  file_put_contents($progressFile, json_encode([
    "history" => []
  ], JSON_PRETTY_PRINT));
}

$raw = file_get_contents($progressFile);
$progress = json_decode($raw, true);
if (!is_array($progress)) $progress = ["history" => []];

$progress["history"][] = [
  "timestamp" => date("c"),
  "mode" => $mode,
  "score" => $score,
  "total" => $total
];

// Keep file small
if (count($progress["history"]) > 200) {
  $progress["history"] = array_slice($progress["history"], -200);
}

file_put_contents($progressFile, json_encode($progress, JSON_PRETTY_PRINT));

echo json_encode(["ok" => true, "saved" => true]);