import dotenv from 'dotenv'
import connectDb from './db/index.js'
import { app } from './app.js'

const port =  process.env.PORT || 8000

dotenv.config()
connectDb()

.then(()=>{
    app.listen(port, ()=>{
        console.log(`Listinging at port ${port}`)
    })
})
.catch((err)=>{
    console.log("Mongodb connection failed!")
})