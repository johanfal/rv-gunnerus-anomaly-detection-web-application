import io from 'socket.io-client';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';



export class Test extends React.Component {
        // var socket = io.connect(null,{rememberTransport:false});
        socket = io.connect();
        // socket.on('connect_response', (data) => {
        //     console.log(data.data)
        //     socket.emit('connect_response',{'index':5})
        // });
        componentDidMount(){
            fetch(`/timestamp_values/${10}/${'time'}/${'me1_exhausttemp1'}`).then(response => response.json().then(data => {
                const ul = document.createElement('ul');
                const li1 = document.createElement('li');
                const li2 = document.createElement('li');
                const li3 = document.createElement('li');
                li1.innerHTML = 'id: ' + data.id
                li2.innerHTML = 'time: ' + data.time
                li3.innerHTML = 'exhaust temp1: ' + data.me1_exhausttemp1
                ul.innerHTML = li1.outerHTML +li2.outerHTML + li3.outerHTML
                $('#test_div').append(ul)
            })
            );

        }

        componentWillUnmount() {
            this.socket.disconnect();
            this.socket.on('disconnect', data => {
                console.log(data)
            }, []);
            console.log('Unmount')
        }

    render = () => (
        <div id="test_div" />
    )
}

export default Test;