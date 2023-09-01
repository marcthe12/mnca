import React, { useState } from 'react'
import Layout from './Layout.jsx'

import MainApp from './MainApp.jsx'

export default function App() {
  return <React.StrictMode>
    <Layout>
      <MainApp/>
    </Layout>
  </React.StrictMode>
}
