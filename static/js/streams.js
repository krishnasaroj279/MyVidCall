const APP_ID = '66f6b39404d74c7b843b6006a8b66076'
// getting values from sessionStorage and setting channel, token, UID values
const CHANNEL = sessionStorage.getItem('room')
const TOKEN = sessionStorage.getItem('token')
let UID = Number(sessionStorage.getItem('UID'))
let NAME = sessionStorage.getItem('name')


const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})

let localTracks= []  // 0th index has audio and 1st index has video
let remoteUsers = {}

let joinAndDisplayLocalStream = async () => {        //creatio of localstream(room)
    document.getElementById('room-name').innerText = CHANNEL
    
    client.on('user-published', handleUserJoined)       //publishing their track
    client.on('user-left', handleUserLeft)       //removing the user & their track from stream

    try{
        await client.join(APP_ID, CHANNEL, TOKEN, UID); //join channel
    }catch(error){
        console.error(error)
        window.open('/', '_self')
    }

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks() //get audio & video tracks

    let member = await createMember()


    // create player with their ID
    let player = `
                    <div class="video-container" id="user-container-${UID}" >
                    <div class="video-player" id="user-${UID}"></div>    
                    <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                    </div>
                `

    document.getElementById("video-streams").insertAdjacentHTML('beforeend', player); //append them to the video streams

    localTracks[1].play(`user-${UID}`); //play the video

    await client.publish([localTracks[0], localTracks[1]]); //publish the track

}

let handleUserJoined = async (user, mediaType) => {  //joining of the 2nd user (user-> object of remote user)
    remoteUsers[user.uid] = user                //remote user id
    await client.subscribe(user, mediaType)     //joining the user with room

    if (mediaType === 'video'){
        let player = document.getElementById(`user-container-${user.uid}`);
        if (player != null){
            player.remove(); // delete already existing video player of the user (rejoin or reload)
        }

        let member = await getMember(user)

        // adding the user
        player = `
                    <div class="video-container" id="user-container-${user.uid}" >
                    <div class="video-player" id="user-${user.uid}"></div>
                        <div class="username-wrapper"><span class="user-name">${member.name}</span></div>    
                    </div>
                `

        document.getElementById("video-streams").insertAdjacentHTML('beforeend', player); 
        //adding their videoTrack
        user.videoTrack.play(`user-${user.uid}`);

    }
    //adding their audioTrack
    if (mediaType === 'audio'){
        user.audioTrack.play();
    }
}

//removing user
let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];           //rmeoving their id
    document.getElementById(`user-container-${user.uid}`).remove(); 
}

//leave button
let leaveAndRemoveLocalStream = async () => {
    for(let i=0; localTracks.length > i; i++){
        localTracks[i].stop();          // stop their audio and video track
        localTracks[i].close();         // close their tracks
    }       
    await client.leave();

    deleteMember()

    window.open('/', '_self');          // redirect
}

//camera button
let toggleCamera = async (e) => {
    if(localTracks[1].muted){           //check if cam is off
        await localTracks[1].setMuted(false);               //turn cam on
        e.target.style.backgroundColor = '#fff';            
    } 
    else{
        await localTracks[1].setMuted(true);        // turn cam off
        e.target.style.backgroundColor = 'rgba(255, 80, 80, 1)';        
    } 
}


//mic button
let toggleMic = async (e) => {
    if(localTracks[0].muted){           //check if mic is off
        await localTracks[0].setMuted(false);               //turn mic on
        e.target.style.backgroundColor = '#fff';            
    } 
    else{
        await localTracks[0].setMuted(true);        // turn mic off
        e.target.style.backgroundColor = 'rgba(255, 80, 80, 1)';        
    } 
}


let createMember = async () => {
    let response = await fetch('/create_member/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID':UID})
    })
    let member = await response.json()
    return member
}

let getMember = async (user) => {
    let response = await fetch(`/get_member/?UID=${user.uid}&room_name=${CHANNEL}`)
    let member = await response.json()
    return member
}

let deleteMember = async () => {
    let response = await fetch('/delete_member/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID':UID})
    })
    let member = await response.json()
}

joinAndDisplayLocalStream();            // the room is created

window.addEventListener('beforeunload', deleteMember)

document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream);      //when clicked, invokes the function
document.getElementById('camera-btn').addEventListener('click', toggleCamera);      //when clicked, invokes the function
document.getElementById('mic-btn').addEventListener('click', toggleMic);      //when clicked, invokes the function


