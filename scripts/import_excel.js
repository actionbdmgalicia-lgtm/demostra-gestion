const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const EXCEL_PATH = '/Users/maccuatro/Library/CloudStorage/GoogleDrive-actionbdmgalicia@gmail.com/Mi unidad/0_FORESVI/PROYECTOS ANTIGRAVITY/DEMOSTRA GESTION/SEGUIMIENTO FERIAS 2026_Ejemplo TIPO copia.xlsx';
const OUTPUT_PATH = path.join(__dirname, '../src/data/db.json');

const VALID_CATEGORIES = [
    'VENTA', 'CARPINTERIA', 'MONTAJE', 'MATERIAL', 'TRANSPORTE',
    'GASTOS VIAJE', 'MOB ALQ', 'ELECTRICIDAD', 'SSFF',
    'MOB COMPRA', 'GRAFICA', 'GASTOS GG', 'OTROS'
];

function mapCategory(rawCat) {
    if (!rawCat) return 'OTROS';
    const upper = rawCat.toString().toUpperCase().trim();
    // Direct match
    if (VALID_CATEGORIES.includes(upper)) return upper;

    // Heuristics
    if (upper.includes('VIAJE') || upper.includes('DIETA') || upper.includes('HOTEL')) return 'GASTOS VIAJE';
    if (upper.includes('CARPINTERIA')) return 'CARPINTERIA';
    if (upper.includes('MONTAJE')) return 'MONTAJE';
    if (upper.includes('TRANSPORTE')) return 'TRANSPORTE';
    if (upper.includes('ELECTRICIDAD')) return 'ELECTRICIDAD';
    if (upper.includes('GRAFICA')) return 'GRAFICA';
    if (upper.includes('COMPRA')) return 'MOB COMPRA';
    if (upper.includes('ALQUILER') || upper.includes('MOB')) return 'MOB ALQ';
    if (upper.includes('SERVICIOS') || upper.includes('FERIAL')) return 'SSFF';

    return 'OTROS';
}

function run() {
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = 'COSTES VENTAS 2026'; // As requested (corrected)
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        console.error(`Sheet "${sheetName}" not found! Available sheets: ${workbook.SheetNames.join(', ')}`);
        process.exit(1);
    }

    const rows = XLSX.utils.sheet_to_json(sheet);
    console.log(`Found ${rows.length} rows.`);
    if (rows.length > 0) {
        console.log('First 5 rows raw:', rows.slice(0, 5));
    }

    const fairsMap = new Map();

    rows.forEach((row, index) => {
        // Expected columns: "Fecha de Inicio", "FERIA", "Cliente", "Proveedor / Descripcion", "Importe", "Tipo"
        const dateRaw = row['Fecha de Inicio'] || row['Fecha'];
        const fairName = row['FERIA'] || row['Feria'];
        const clientName = row['Cliente'];
        const providerDesc = row['Proveedor / Descripcion'] || row['Proveedor'];
        const amount = row['Importe'] || 0;
        const typeRaw = row['Tipo'] || 'OTROS';

        if (!fairName) return; // Skip empty rows

        // Parse Date
        let dateStr = new Date().toISOString().split('T')[0];
        if (dateRaw) {
            // Excel dates are numbers usually (days since 1900)
            if (typeof dateRaw === 'number') {
                const d = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
                dateStr = d.toISOString().split('T')[0];
            } else {
                // Try string parsing
                try {
                    dateStr = new Date(dateRaw).toISOString().split('T')[0];
                } catch (e) { }
            }
        }

        // Initialize Fair
        if (!fairsMap.has(fairName)) {
            fairsMap.set(fairName, {
                id: fairName.replace(/\s+/g, '-').toUpperCase() + '-' + Date.now(),
                name: fairName,
                status: 'Active',
                date: dateStr,
                clients: [],
                realExpenses: []
            });
        }
        const fair = fairsMap.get(fairName);

        // Initialize Client
        const normalizedClientName = clientName ? clientName.trim() : 'VARIOS';
        let client = fair.clients.find(c => c.name === normalizedClientName);
        if (!client) {
            client = {
                id: normalizedClientName.replace(/\s+/g, '-').toUpperCase() + '-' + Date.now() + Math.floor(Math.random() * 1000),
                name: normalizedClientName,
                status: 'Active',
                budget: { income: [], expenses: [] },
                costs: []
            };
            fair.clients.push(client);
        }

        // Create Item
        const category = mapCategory(typeRaw);
        const type = category === 'VENTA' ? 'INCOME' : 'EXPENSE';
        const isExpense = type === 'EXPENSE';

        // Distribution (100% to this client)
        const distribution = {};
        distribution[client.id] = parseFloat(amount) || 0;

        // Add to Real Expenses
        const expenseItem = {
            id: 'EXP-' + Date.now() + '-' + index,
            category: category,
            provider: providerDesc || '',
            concept: providerDesc || '', // Use same for concept
            totalAmount: parseFloat(amount) || 0,
            date: dateStr,
            type: type, // 'INCOME' or 'EXPENSE'
            distribution: distribution,
            distributionMode: 'MANUAL',
            createdAt: new Date().toISOString()
        };
        fair.realExpenses.push(expenseItem);

        // Add to Budget (to create a starting plan)
        // Usually budget expenses are negative in the inner logic, but stored as positive 'estimated'.
        // Income is 'amount'.
        if (isExpense) {
            client.budget.expenses.push({
                category: category,
                description: providerDesc || 'Gasto estimado',
                estimated: parseFloat(amount) || 0
            });
        } else {
            client.budget.income.push({
                category: 'VENTA',
                description: 'Venta',
                amount: parseFloat(amount) || 0
            });
        }
    });

    const db = {
        fairs: Array.from(fairsMap.values())
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(db, null, 2));
    console.log(`Database saved to ${OUTPUT_PATH} with ${db.fairs.length} fairs.`);
}

run();
