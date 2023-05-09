import style from './App.module.css';
import Generator from './Generator/Generator';

function App() {
    return (
        <div>
            <main className={style.container}>
                <h1 className={style.title}>Encoding generator</h1>
                <Generator />
            </main>
        </div>
    );
}

export default App;
