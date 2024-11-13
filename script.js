let productsData = null;
let merchantsList = [];

async function loadProducts() {
  try {
    const response = await fetch("products.json");
    productsData = await response.json();
    renderProducts("vegetables");
    renderProducts("fruits");
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

function renderProducts(type) {
  const table = document
    .getElementById(`${type}Table`)
    .getElementsByTagName("tbody")[0];
  table.innerHTML = "";

  productsData[type].forEach((product) => {
    const row = table.insertRow();
    row.innerHTML = `
      <td>
        <span class="emoji">${product.emoji}</span>
        <span>${product.name}</span>
      </td>
      <td>
        <input type="number" 
               step="0.01" 
               placeholder="מחיר לק״ג" 
               id="price-${product.name}"
               class="price-input">
      </td>
      <td>
        <input type="text" 
               placeholder="הערות" 
               id="notes-${product.name}"
               class="notes-input">
      </td>
    `;
  });
}

function saveForm() {
  const merchantName = document.getElementById("merchantName").value;
  if (!merchantName) {
    alert("אנא בחר סוחר או הזן פרטי סוחר");
    return;
  }

  const formData = {
    merchantDetails: {
      name: merchantName,
      location: document.getElementById("location").value,
      phone: document.getElementById("phone").value,
    },
    vegetables: getProductsData("vegetables"),
    fruits: getProductsData("fruits"),
    generalNotes: document.getElementById("generalNotes").value,
    lastUpdate: new Date().toLocaleString("he-IL"),
  };

  localStorage.setItem(
    `priceFormData_${merchantName}`,
    JSON.stringify(formData)
  );
  alert("הטופס נשמר בהצלחה!");
}

function getProductsData(type) {
  return productsData[type].map((product) => ({
    name: product.name,
    emoji: product.emoji,
    price: document.getElementById(`price-${product.name}`).value,
    notes: document.getElementById(`notes-${product.name}`).value,
  }));
}

function exportToExcel() {
  const formData = JSON.parse(localStorage.getItem("priceFormData"));
  if (!formData) {
    alert("אין נתונים לייצוא. אנא שמור את הטופס תחילה.");
    return;
  }

  const ws_data = [
    ["שם הסוחר", formData.merchantDetails.name],
    ["מיקום", formData.merchantDetails.location],
    ["טלפון", formData.merchantDetails.phone],
    [""],
    ["ירקות"],
    ["שם המוצר", 'מחיר לק"ג', "הערות"],
  ];

  // הוספת נתוני ירקות
  formData.vegetables.forEach((item) => {
    ws_data.push([`${item.emoji} ${item.name}`, item.price, item.notes]);
  });

  ws_data.push([""]);
  ws_data.push(["פירות"]);
  ws_data.push(["שם המוצר", 'מחיר לק"ג', "הערות"]);

  // הוספת נתוני פירות
  formData.fruits.forEach((item) => {
    ws_data.push([`${item.emoji} ${item.name}`, item.price, item.notes]);
  });

  ws_data.push([""]);
  ws_data.push(["הערות כלליות", formData.generalNotes]);

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "מחירון");

  // ייצוא לקובץ
  XLSX.writeFile(wb, "מחירון_פירות_וירקות.xlsx");
}

function sendToWhatsApp() {
  const merchantName = document.getElementById("merchantName").value;
  if (!merchantName) {
    alert("אנא בחר סוחר או הזן פרטי סוחר לפני השליחה");
    return;
  }

  // קבלת הנתונים העדכניים מהטופס
  const currentFormData = {
    merchantDetails: {
      name: merchantName,
      location: document.getElementById("location").value,
      phone: document.getElementById("phone").value,
    },
    vegetables: getProductsData("vegetables"),
    fruits: getProductsData("fruits"),
    generalNotes: document.getElementById("generalNotes").value,
  };

  let message = `מחירון פירות וירקות - ${new Date().toLocaleDateString(
    "he-IL"
  )}\n\n`;

  // פרטי סוחר
  message += `👤 *פרטי הסוחר:*\n`;
  message += `🏪 ${currentFormData.merchantDetails.name}\n`;
  message += `📍 מיקום: ${currentFormData.merchantDetails.location}\n`;
  message += `📞 טלפון: ${currentFormData.merchantDetails.phone}\n\n`;

  // ירקות
  message += `🥬 *ירקות:*\n`;
  currentFormData.vegetables.forEach((item) => {
    if (item.price) {
      const notes = item.notes ? ` (${item.notes})` : "";
      message += `${item.emoji} ${item.name}: ${item.price}₪${notes}\n`;
    }
  });

  // פירות
  message += `\n🍎 *פירות:*\n`;
  currentFormData.fruits.forEach((item) => {
    if (item.price) {
      const notes = item.notes ? ` (${item.notes})` : "";
      message += `${item.emoji} ${item.name}: ${item.price}₪${notes}\n`;
    }
  });

  if (currentFormData.generalNotes) {
    message += `\n📝 *הערות:*\n${currentFormData.generalNotes}\n`;
  }

  message += `\n⏰ נשלח בתאריך: ${new Date().toLocaleString("he-IL")}`;

  const phoneNumber = "972543285967";
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
  window.open(whatsappUrl, "_blank");
}

// טעינת הסוחרים בעת טעינת הדף
async function loadMerchantsList() {
  try {
    const response = await fetch("merchants.json");
    const data = await response.json();
    merchantsList = data.merchants;
    populateMerchantsSelect();
  } catch (error) {
    console.error("Error loading merchants:", error);
  }
}

// מילוי רשימת הסוחרים בתיבת הבחירה
function populateMerchantsSelect() {
  const select = document.getElementById("merchantSelect");
  merchantsList.forEach((merchant) => {
    const option = document.createElement("option");
    option.value = merchant.id;
    option.textContent = `${merchant.name} - ${merchant.location}`;
    select.appendChild(option);
  });
}

// בחירת סוחר ומילוי הפרטים
function selectMerchant(merchantId) {
  if (!merchantId) {
    clearMerchantDetails();
    clearAllPrices();
    return;
  }

  const merchant = merchantsList.find((m) => m.id === merchantId);
  if (merchant) {
    // מילוי פרטי הסוחר
    document.getElementById("merchantName").value = merchant.name;
    document.getElementById("location").value = merchant.location;
    document.getElementById("phone").value = merchant.phone;

    // טעינת המחירון האחרון של הסוחר
    const savedData = localStorage.getItem(`priceFormData_${merchant.name}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        loadSavedPrices(parsedData);
        console.log("נטענו מחירים שמורים עבור", merchant.name);
      } catch (error) {
        console.error("שגיאה בטעינת מחירים שמורים:", error);
        clearAllPrices();
      }
    } else {
      console.log("לא נמצאו מחירים שמורים עבור", merchant.name);
      clearAllPrices();
    }
  }
}

// ניקוי פרטי הסוחר
function clearMerchantDetails() {
  document.getElementById("merchantName").value = "";
  document.getElementById("location").value = "";
  document.getElementById("phone").value = "";
}

function clearAllPrices() {
  // ניקוי כל המחירים וההערות בטבלאות
  document.querySelectorAll(".price-input, .notes-input").forEach((input) => {
    input.value = "";
  });
  document.getElementById("generalNotes").value = "";
}

function loadSavedPrices(data) {
  if (!data.vegetables || !data.fruits) {
    console.error("נתונים לא תקינים:", data);
    return;
  }

  // טעינת מחירים והערות לירקות
  data.vegetables.forEach((item) => {
    const priceInput = document.getElementById(`price-${item.name}`);
    const notesInput = document.getElementById(`notes-${item.name}`);
    if (priceInput && item.price) priceInput.value = item.price;
    if (notesInput && item.notes) notesInput.value = item.notes;
  });

  // טעינת מחירים והערות לפירות
  data.fruits.forEach((item) => {
    const priceInput = document.getElementById(`price-${item.name}`);
    const notesInput = document.getElementById(`notes-${item.name}`);
    if (priceInput && item.price) priceInput.value = item.price;
    if (notesInput && item.notes) notesInput.value = item.notes;
  });

  // טעינת הערות כלליות
  if (data.generalNotes) {
    document.getElementById("generalNotes").value = data.generalNotes;
  }
}

// עדכון טעינת הדף
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadMerchantsList();
  updateLastUpdateDate();
});

// הוספה בתחילת הקובץ
function getCurrentHebrewDate() {
  return new Date().toLocaleDateString("he-IL");
}

// הוספת פונקציה לעדכון תאריך בכותרת
function updateHeaderDate() {
  const dateStr = getCurrentHebrewDate();
  document.getElementById("currentDate").textContent = dateStr;
}

function savePriceHistory(merchantName, productData) {
  const history = JSON.parse(
    localStorage.getItem(`priceHistory_${merchantName}`) || "{}"
  );
  const date = getCurrentHebrewDate();

  if (!history[date]) {
    history[date] = {};
  }

  history[date][productData.name] = {
    price: productData.price,
    notes: productData.notes,
  };

  localStorage.setItem(`priceHistory_${merchantName}`, JSON.stringify(history));
}

// הוספה בתחילת הקובץ או בפונקציית DOMContentLoaded
function updateLastUpdateDate() {
  const lastUpdateElement = document.getElementById("lastUpdateDate");
  const now = new Date();
  const formattedDate = now.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  lastUpdateElement.textContent = formattedDate;
}
