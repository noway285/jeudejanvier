<?php
// api.php - Gestion simple des scores JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$file = 'scores.json';

// Initialiser le fichier s'il n'existe pas
if (!file_exists($file)) {
    file_put_contents($file, json_encode([]));
}

// Récupérer la méthode (GET ou POST)
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Lecture des scores
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        echo json_encode([]);
    }
} 
elseif ($method === 'POST') {
    // Enregistrement d'un score
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate: need 'name' and either 'points' (Maboul) or 'seconds' (Andrea)
    if ($input && isset($input['name']) && (isset($input['points']) || isset($input['seconds']))) {
        $current_data = json_decode(file_get_contents($file), true);
        if (!is_array($current_data)) {
            $current_data = [];
        }
        
        // Add timestamp if not present
        if (!isset($input['date'])) {
            $input['date'] = date('c');
        }
        
        // For Andrea scores, convert to points for ranking (lower time = higher points)
        if (isset($input['seconds']) && !isset($input['points'])) {
            // Andrea games: use seconds directly (no points conversion needed)
            // Just ensure points field exists for compatibility
            $input['points'] = max(0, 10000 - intval($input['seconds'] / 1000)); // Rough conversion
        }
        
        // Ajouter le nouveau score
        $current_data[] = $input;
        
        // Trier par points décroissant (for Maboul ranking)
        usort($current_data, function($a, $b) {
            return ($b['points'] ?? 0) - ($a['points'] ?? 0);
        });
        
        // Sauvegarder (avec pretty print pour lecture facile si besoin)
        if (file_put_contents($file, json_encode($current_data, JSON_PRETTY_PRINT))) {
            echo json_encode(['status' => 'success', 'message' => 'Score saved']);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Failed to write to file']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid data - need name and points or seconds']);
    }
}
?>
