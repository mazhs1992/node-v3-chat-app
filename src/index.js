const path= require('path')// no need to install
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter= require('bad-words')

const { generateMessage,generateLocationMessage} = require('./utils/message')
const {addUser, removeUser, getUser,getUsersInRoom} = require('./utils/user')

const app = express()
const server=http.createServer(app)
const io = socketio(server)



app.use(express.json())

const port = process.env.PORT || 3000 //for HEROKU

const publicDirectoryPath = path.join(__dirname,'../public')


app.use(express.static(publicDirectoryPath))

 //let count =0
io.on('connection',(socket)=>{
    console.log('New WebSocket connection')   

    socket.on('join', (options,callback)=>{
        const {error,user}=addUser({ id: socket.id, ...options })

        if(error){
           return callback(error)
        }

        socket.join(user.room) //we can use this only on the server
        socket.emit('message',generateMessage('Admin',`Welcome ${user.username}`))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })

 
    //send message
    socket.on('sendMessage',(message,callback)=>{
        const user=getUser(socket.id)
        const filter = new Filter()

        
        
        if (filter.isProfane(message)){
            return callback('Profanity is not allowed')//for bad language /library
        }

        io.to(user.room).emit('message', generateMessage(user.username,message)) 
        callback()
    })


    //Disconnect
    socket.on('disconnect',() =>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!!`)) 
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
    })

    //Location
    socket.on('sendLocation',(coords,callback)=>{
        const user=getUser(socket.id)
        //io.emit('message', `Location :  ${coords.latitude}  ,  ${coords.longitude}`) 
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps/@${coords.latitude},${coords.longitude}`)) 
        callback()
    })
    

    //CLICK EXAMPLE
    // socket.emit('countUpdated',count)
   
    // //LISTEN TO AN EVENT
    // socket.on('increment',()=>{
    //     count++
    //     //SENT TO THE CLIENT THE UPDATED COUNT
    //     //socket.emit('countUpdated',count)
    //     io.emit('countUpdated',count)
    // })

})

//Start Server
server.listen(port, ()=>{
    console.log('Server is up on port ' +port)
})