import * as io from 'socket.io-client';
const colors = require('colors/safe');

import {nodeVersionCompatibility, nodeVersion, nodePort} from '../../../../consts/const_global.js';
import {SocketExtend} from '../../../../common/sockets/socket-extend';
import {SocketAddress} from '../../../../common/sockets/socket-address';
import {NodeLists} from '../../../lists/node-lists.js';
import {NodeWaitlist} from '../../../lists/waitlist/node-waitlist.js';

class NodeClient {

    // socket : null,

    constructor(){

        //console.log("NodeClient constructor");

        this.socket = null;
    }

    connectTo(address, port){

        let sckAddress = SocketAddress.createSocketAddress(address, port);


        address = sckAddress.getAddress(false);
        port = sckAddress.port;

        return new Promise( (resolve) => {

            try
            {
                if (address.length < 3){
                    console.log("rejecting address",address);
                    resolve(false);
                    return false;
                }

                // in case the port is not included
                if (address.indexOf(":") === -1)  address += ":"+port;
                if (address.indexOf("http://") === -1 )  address = "http://"+address;

                console.log("connecting... to address", address);

                let socket = null;
                try {

                    // params described in the documentation https://socket.io/docs/client-api#manager
                    socket = io.connect(address, {
                        reconnection: false, //no reconnection because it is managed automatically by the WaitList
                    });

                }  catch (Exception){
                    console.log("Error Connecting Node to ", address," ", Exception.toString());
                    resolve(false);
                    return false;
                }
                this.socket = socket;


                socket.once("connect", (response) =>{

                    SocketExtend.extendSocket(socket, socket.io.opts.hostname||sckAddress.getAddress(false),  socket.io.opts.port||sckAddress.port );

                    console.log(colors.blue("Client connected to " + socket.node.sckAddress.getAddress(true) ));

                    socket.node.protocol.sendHello().then( (answer)=>{
                        this.initializeSocket(socket);

                        resolve(true);
                    });

                });

                socket.once("connect_error", (response) =>{

                    console.log("Client error connecting", address);
                    //NodeLists.disconnectSocket(this.socket);

                    resolve(false);
                });

                socket.once("connect_failed", (response) =>{
                    console.log("Client error connecting (connect_failed) ", address);
                    NodeLists.disconnectSocket(this.socket);

                    resolve(false);
                });

                socket.once("disconnect", () => {

                    console.log("################## disconnect socket")
                    console.log("Client disconnected "); console.log( this.socket.node.sckAddress.getAddress() );
                    NodeLists.disconnectSocket(this.socket);

                });


                socket.connect();

            }
            catch(Exception){
                console.log("Error Raised when connecting Node to ", address," ", Exception.toString());
                resolve(false);
            }

            resolve(true);

        });

    }

    initializeSocket(){

        //it is not unique... then I have to disconnect

        if (NodeLists.addUniqueSocket(this.socket, "client") === false){
            return false;
        }

        console.log(colors.white('Socket Initialized ' + this.socket.node.sckAddress.getAddress(true)));

        this.socket.node.protocol.propagation.initializePropagation();
    }


}

exports.NodeClient =  NodeClient;