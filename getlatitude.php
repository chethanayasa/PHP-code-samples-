

<?php
 
function check_status($jsondata) {
    if ($jsondata["status"] == "OK") return true;
    return false;
}
 
function get_lat($add){
$address = $add_new;
    // Make the HTTP request
 
    $url = 'http://maps.googleapis.com/maps/api/geocode/json?address='.urlencode($address);
    $data= file_get_contents($url);
    // Parse the json response
    $jsondata = json_decode($data,true);
    // If the json data is invalid, return empty array
    if (!check_status($jsondata))   return array();
 
    $LatLng = array(
        'lat'=>$jsondata["results"][0]["geometry"]["location"]["lat"],
        'lng'=>$jsondata["results"][0]["geometry"]["location"]["lng"],
    );
 
   return $LatLng;
}
 
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "smd";
 
// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
$sql = "select member_id,concat(address,', ',city,', ',state,', ',postal_code,',',country) as address from smd_member_address_20150917 order by id";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
   $x=null;
   $x=get_lat($row['address']);
   if (!empty($x)) {
   $lat=null;
   $lan=null;
   $lat=$x['lat'];
   $lan=$x['lng'];
   
 $insert ="update smd_member_address_20150917 set lat=".$lat.", lng =".$lan." where id =".$row['member_id'];
    $sqlupdate = $conn->query($insert);
   }
    }
} else {
    echo "0 results";
}
$conn->close();
?>
