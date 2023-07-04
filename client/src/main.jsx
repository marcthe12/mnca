import React from 'react'
import ReactDOM from 'react-dom/client'
import './main.css'

const App = () => (<p>Hello World</p>)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>,
)
