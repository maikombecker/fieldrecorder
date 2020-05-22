<?php
// via: https://github.com/muaz-khan/RecordRTC/blob/master/RecordRTC-to-PHP/save.php
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header('Access-Control-Allow-Headers: X-Requested-With, content-type, access-control-allow-methods');
// Comment out the line below right after data collection
header("Access-Control-Allow-Origin: https://ibex.phonologist.org");
function selfInvoker()
{
    if (!isset($_POST['fileName'])) {
        echo 'PermissionDeniedError';
        return;
    }
    $fileName = '';
    $tempName = '';
    if (isset($_POST['fileName'])) {
        $fileName = $_POST['fileName'];
        $tempName = $_FILES['file']['tmp_name'];
    }
    if (empty($fileName) || empty($tempName)) {
        echo 'PermissionDeniedError';
        return;
    }
    $filePath = 'uploads/' . $fileName;
    // make sure that one can upload only allowed zip files
    $allowed = array(
        'zip'
    );
    $extension = pathinfo($filePath, PATHINFO_EXTENSION);
    if (!$extension || empty($extension) || !in_array($extension, $allowed)) {
        echo 'PermissionDeniedError';
    }
    if (!move_uploaded_file($tempName, $filePath)) {
        echo ('Problem saving file.');
        return;
    }
    echo ($filePath);
}
selfInvoker();
?>