import { Outlet } from 'react-router-dom'
import './App.css'
import AppSidebar from './components/layouts/AppSidebar'
import { SidebarTrigger } from './components/ui/sidebar'

// !TODO ADD DATA_TABLE

function App() {

    return (
        <div className="app-container">
            <AppSidebar />
           <main className="main-content">
               <SidebarTrigger />
               <Outlet /> {/* This is where your page components will render */}
           </main>
       </div>
  )
}

export default App
