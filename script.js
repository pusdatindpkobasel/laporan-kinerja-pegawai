const API_URL = 'https://script.google.com/macros/s/AKfycbwUZBGHglJe5Z0M7NBAfODy0CrShbYAGvPvGGAOcDCCeFwRit0aYcD3M65ViOqMabU4/exec';
let pegawaiList = [];
let currentPegawai = null;
let sesiStatus = {};

// Load daftar pegawai saat halaman dimuat
window.onload = async () => {
  const res = await fetch(`${API_URL}?action=getPegawai`);
  pegawaiList = await res.json();
  const namaSelect = document.getElementById('nama');
  pegawaiList.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.nama;
    opt.textContent = p.nama;
    namaSelect.appendChild(opt);
  });
};

// Login dan tampilkan form
async function login() {
  const nama = document.getElementById('nama').value;
  const pin = document.getElementById('pin').value;
  if (!nama || !pin) return Swal.fire('Lengkapi isian!', '', 'warning');

  Swal.showLoading();
  const res = await fetch(API_URL + '?action=login', {
    method: 'POST',
    body: JSON.stringify({ nama, pin }),
    headers: { 'Content-Type': 'application/json' }
  });
  const result = await res.json();
  Swal.close();

  if (!result.success) return Swal.fire('PIN salah', '', 'error');

  currentPegawai = pegawaiList.find(p => p.nama === nama);
  document.getElementById('nip').textContent = currentPegawai.nip;
  document.getElementById('subbid').textContent = currentPegawai.subbid;
  document.getElementById('status').textContent = currentPegawai.status;
  document.getElementById('gol').textContent = currentPegawai.gol;
  document.getElementById('jabatan').textContent = currentPegawai.jabatan;

  document.getElementById('form-wrapper').style.display = 'block';
  await loadStatusSesi();
  renderForm();
}

// Ambil status sesi yang sudah diisi
async function loadStatusSesi() {
  const res = await fetch(`${API_URL}?action=getSesi&nama=${encodeURIComponent(currentPegawai.nama)}`);
  sesiStatus = await res.json();
}

// Tampilkan form per sesi
function renderForm() {
  const div = document.getElementById('sesi-form');
  div.innerHTML = '';
  for (let i = 1; i <= 7; i++) {
    const status = sesiStatus[`sesi${i}`] ? '✅' : '';
    const disabled = sesiStatus[`sesi${i}`] ? 'disabled' : '';
    const html = `
      <div class="card mb-3">
        <div class="card-header">Sesi ${i} ${status}</div>
        <div class="card-body">
          <div class="mb-2">
            <label>Kegiatan</label>
            <textarea id="kegiatan${i}" class="form-control" ${disabled}></textarea>
          </div>
          <div class="mb-2">
            <label>Bukti Dukung</label>
            <input type="file" id="bukti${i}" class="form-control" ${disabled}>
          </div>
          <button class="btn btn-success" onclick="submitSesi(${i})" ${disabled}>Submit Sesi ${i}</button>
        </div>
      </div>
    `;
    div.innerHTML += html;
  }
}

// Upload dan submit sesi
async function submitSesi(i) {
  const kegiatan = document.getElementById(`kegiatan${i}`).value.trim();
  const file = document.getElementById(`bukti${i}`).files[0];
  if (!kegiatan) return Swal.fire('Kegiatan belum diisi!', '', 'warning');

  Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  let fileUrl = '';
  if (file) {
    const base64 = await toBase64(file);
    const uploadRes = await fetch(API_URL + '?action=uploadFile', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, base64 }),
      headers: { 'Content-Type': 'application/json' }
    });
    fileUrl = await uploadRes.text();
  }

  const payload = {
    nama: currentPegawai.nama,
    nip: currentPegawai.nip,
    subbid: currentPegawai.subbid,
    status: currentPegawai.status,
    golongan: currentPegawai.gol,
    jabatan: currentPegawai.jabatan,
    sesi: `sesi${i}`,
    kegiatan,
    bukti: fileUrl
  };

  const submitRes = await fetch(API_URL + '?action=submitSesi', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  });
  const result = await submitRes.text();
  Swal.close();

  if (result === 'OK') {
    Swal.fire('Berhasil disimpan!', '', 'success');
    await loadStatusSesi();
    renderForm();
  } else if (result === 'ALREADY_FILLED') {
    Swal.fire('Sesi sudah diisi sebelumnya.', '', 'info');
  } else if (result === 'DI_LUAR_JAM') {
    Swal.fire('Diluar jam pengisian (08:00–22:00)', '', 'warning');
  } else if (result === 'HARI_LIBUR') {
    Swal.fire('Hanya bisa mengisi pada hari kerja (Senin–Jumat)', '', 'warning');
  } else {
    Swal.fire('Terjadi kesalahan saat menyimpan.', result, 'error');
  }
}

// Konversi file ke base64
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
