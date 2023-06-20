

//  to UPDATE tandyLinx, just change the values in the "data" array

for(let i=0 ; i < data.length ;  i++){

    var current_link_data = data[i]; // cycle through all of the objects in data array

    var button = document.createElement("a"); //create link

    button.className = "link";
    button.innerHTML = current_link_data.name; // set name from data
    button.setAttribute('href', current_link_data.url); //set url from data
    button.setAttribute('onmouseover', 'hover();'); //set url from data
    button.setAttribute('onmouseout', 'unhover();'); //set url from data


    document.getElementById("links_container").appendChild(button); //append link to end of container
}
