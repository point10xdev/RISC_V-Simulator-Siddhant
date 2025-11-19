RISC-V Simulator

A full-stack RISC-V Instruction Set Simulator built using Node.js (backend) and React (frontend).
This tool allows users to write RISC-V assembly instructions, execute them, and visualize the internal workings of the processor — including registers, memory, and execution flow.

⭐ Features


🧮 Core Functionality

    Parse and validate RISC-V assembly instructions
    Simulate instruction execution cycle-by-cycle
    Support for arithmetic, logical, load/store, and control-flow instructions
    Register file and memory emulation
    Real-time output and error reporting

💻 Frontend (React)

    Clean UI for writing and running code
    Visual display of:
    Register states
    Memory changes
    Execution log
    Interactive editor with responsive layout

⚙️ Backend (Node.js / Express)

    Instruction parser
    Execution engine
    Decoder and utilities
    REST API for sending instructions & receiving results
    Safe isolated execution environment


🚀 How to Run the Project

    1️⃣ Clone the repository
    git clone https://github.com/SiddhantPrakash485/RISC-V_SIMULATOR
    cd RISC-V_SIMULATOR

    2️⃣ Setup Backend
    cd backend
    npm install
    npm start

    3️⃣ Setup Frontend
    cd frontend
    npm install
    npm start



🧪 Technologies Used
    
    Frontend
        React.js
        JavaScript
        CSS
                
    Backend
        Node.js
        Express.js
        JavaScript



📌 Future Enhancements

    Support additional RISC-V extensions
    Pipeline visualization
    Assembly code highlighting & autocomplete
    Step-by-step execution mode
    Memory dump export


🙌 Contributions

    Contributions, issues, and feature requests are welcome!
    Feel free to open a Pull Request.