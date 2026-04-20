import AppRouter from "./routes/AppRouter";
import { ToastContainer } from "./components/Toast";

function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  );
}

export default App;
