/* Configuration */
const PIXEL_ID = 'YOUR_PIXEL_ID'; 
const N8N_WEBHOOK = 'http://localhost:5678/webhook-test/submit-form'; 
const PRICE_PER_UNIT = 900;

/* Global State */
let quantity = 1;

/* ============================
   1. COUNTDOWN TIMER LOGIC
   ============================ */
function startCountdown() {
    let time = 5 * 60 * 60; // 5 hours
    const countdownEl = document.getElementById('countdown');
    
    if(!countdownEl) return;

    setInterval(() => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = time % 60;

        // Bengali Digits function optional, but english digits usually preferred for countdowns 
        // to avoid layout shifts. Keeping english digits for timer.
        countdownEl.innerText = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
        
        if (time > 0) {
            time--;
        }
    }, 1000);
}

/* ============================
   2. CART & FORM LOGIC
   ============================ */
function changeQuantity(delta) {
    quantity = Math.max(1, quantity + delta);
    document.getElementById('quantityDisplay').innerText = quantity;
    document.getElementById('quantity').value = quantity;
    updateTotals();
}

function updateTotals() {
    const total = quantity * PRICE_PER_UNIT;
    document.getElementById('productTotal').innerText = total;
    document.getElementById('totalAmount').innerText = total;
    document.getElementById('btnTotal').innerText = total; 
}

// Handle Payment Radio Buttons
function handlePaymentChange() {
    const radios = document.getElementsByName('payment');
    let selectedValue = 'cod';
    
    for (const radio of radios) {
        if (radio.checked) {
            selectedValue = radio.value;
            break;
        }
    }
    
    const select = document.getElementById('payment');
    if(select) select.value = selectedValue;

    const bkashBox = document.getElementById('bkashBox');
    const nagadBox = document.getElementById('nagadBox');
    
    if (bkashBox) bkashBox.style.display = 'none';
    if (nagadBox) nagadBox.style.display = 'none';
    
    if (selectedValue === 'bkash' && bkashBox) bkashBox.style.display = 'block';
    if (selectedValue === 'nagad' && nagadBox) nagadBox.style.display = 'block';
}

/* ============================
   3. FORM SUBMISSION
   ============================ */
document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btn = this.querySelector('.submit-btn');
    const originalBtnText = btn.innerHTML;
    
    // 1. Validation
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    
    const radios = document.getElementsByName('payment');
    let payment = 'cod';
    for (const radio of radios) { if (radio.checked) payment = radio.value; }

    if (!name || !phone || !address) {
        alert('অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং ঠিকানা লিখুন।'); // Bengali Alert
        return;
    }

    if (payment === "bkash" && (!document.getElementById('bk_sender').value || !document.getElementById('bk_trxid').value)) {
        alert("অনুগ্রহ করে আপনার বিকাশ নম্বর এবং ট্রানজেকশন আইডি দিন।"); // Bengali Alert
        return;
    }
    if (payment === "nagad" && (!document.getElementById('ng_sender').value || !document.getElementById('ng_trxid').value)) {
        alert("অনুগ্রহ করে আপনার নগদ নম্বর এবং ট্রানজেকশন আইডি দিন।"); // Bengali Alert
        return;
    }

    // 2. Loading State
    btn.innerHTML = 'প্রসেসিং হচ্ছে...'; // Bengali Loading
    btn.disabled = true;

    // 3. Prepare Data
    const payload = {
        name, phone, address, payment,
        quantity,
        total: quantity * PRICE_PER_UNIT,
        date: new Date().toISOString(),
        paymentDetails: payment !== 'cod' ? {
            sender: document.getElementById(payment === 'bkash' ? 'bk_sender' : 'ng_sender').value,
            trxid: document.getElementById(payment === 'bkash' ? 'bk_trxid' : 'ng_trxid').value
        } : null
    };

    // 4. Send Data
    try {
        if (N8N_WEBHOOK ) { //&& N8N_WEBHOOK !== 'http://localhost:5678/webhook/submit-form'
            await fetch(N8N_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        
        if (typeof fbq === 'function') {
            fbq('track', 'Purchase', { 
                value: payload.total, 
                currency: 'BDT', 
                content_name: 'UGREEN Converter' 
            });
        }

        // 5. Success UI
        document.getElementById('successMsg').style.display = 'block';
        document.getElementById('orderForm').reset();
        window.scrollTo({ top: document.getElementById('order').offsetTop, behavior: 'smooth' });

    } catch (err) {
        console.error(err);
        alert('কোথাও সমস্যা হয়েছে। কিন্তু আমরা আপনার অর্ডারটি পেয়েছি, শীঘ্রই কল করবো।'); // Bengali Error
    } finally {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
        
        // Reset Logic
        quantity = 1; 
        updateTotals();
        document.getElementById('bkashBox').style.display = 'none';
        document.getElementById('nagadBox').style.display = 'none';
        if(radios[0]) radios[0].checked = true;
    }
});

/* ============================
   4. CAROUSEL
   ============================ */
class Carousel {
    constructor() {
        this.track = document.getElementById('carouselTrack');
        this.slides = Array.from(this.track ? this.track.children : []);
        if(this.slides.length === 0) return;

        this.nextBtn = document.getElementById('nextBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.dotsContainer = document.getElementById('indicators');
        this.currentIndex = 0;

        this.init();
    }

    init() {
        this.slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.classList.add('indicator'); 
            if(i===0) dot.classList.add('active');
            dot.addEventListener('click', () => this.goTo(i));
            this.dotsContainer.appendChild(dot);
        });

        if(this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());
        if(this.prevBtn) this.prevBtn.addEventListener('click', () => this.prev());
    }

    goTo(index) {
        this.currentIndex = index;
        this.track.style.transform = `translateX(-${index * 100}%)`;
        this.updateDots();
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.slides.length;
        this.goTo(this.currentIndex);
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
        this.goTo(this.currentIndex);
    }

    updateDots() {
        const dots = this.dotsContainer.querySelectorAll('button');
        dots.forEach((d, i) => d.classList.toggle('active', i === this.currentIndex));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Carousel();
    startCountdown();
    updateTotals();
});