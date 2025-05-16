const API_URL = 'https://script.google.com/macros/s/AKfycbyUC0sNeyxFMxT9ax4XPq96dHjePen5sCkf5WjQq29vGsme0T6wmO1MYJO_51tat2ZE7g/exec';

let pegawaiData = [];
let laporanData = {};

function getPegawai() {
  fetch(`${API_URL}?action=getPegawai`)
    .then(response => response.text())
    .then(data => {
      eval(data);  // This will call handlePegawai function
    })
    .catch(error => console.error('Error fetching pegawai:', error));
}

function handlePegawai(data) {
  pegawaiData = data;
  const namaSelect = document.getElementById('nama');
  pegawaiData.forEach(pegawai => {
    const option = document.createElement('option');
    option.value = pegawai[0];  // Assumes pegawai[0] is the name
    option.innerText = pegawai[0];
    namaSelect.appendChild(option);
  });
}

function getLaporan() {
  const nama = document.getElementById('nama').value;
  if (!nama) {
    alert('Pilih nama terlebih dahulu');
    return;
  }

  fetch(`${API_URL}?action=getLaporan&nama=${nama}`)
    .then(response => response.json())
    .then(data => {
      laporanData = data;
      updateFormStatus();
    })
    .catch(error => console.error('Error fetching laporan:', error));
}

function updateFormStatus() {
  for (let i = 1; i <= 7; i++) {
    const sesiInput = document.getElementById(`sesi${i}`);
    const buktiInput = document.getElementById(`bukti${i}`);
    const sesiStatus = document.getElementById(`statusSesi${i}`);

    if (laporanData[`sesi${i}`] && laporanData[`bukti${i}`]) {
      sesiInput.disabled = true;
      buktiInput.disabled = true;
      sesiStatus.innerText = 'Terkirim';
      sesiStatus.style.color = 'green';
    } else {
      sesiInput.disabled = false;
      buktiInput.disabled = false;
      sesiStatus.innerText = 'Belum Terkirim';
      sesiStatus.style.color = 'red';
    }
  }
}

function submitForm() {
  const nama = document.getElementById('nama').value;
  const nip = pegawaiData.find(pegawai => pegawai[0] === nama)[1]; // Assumes nip is in the second column
  const subbid = pegawaiData.find(pegawai => pegawai[0] === nama)[2]; // Assumes subbid is in the third column
  const status = pegawaiData.find(pegawai => pegawai[0] === nama)[3]; // Assumes status is in the fourth column
  const golongan = pegawaiData.find(pegawai => pegawai[0] === nama)[4]; // Assumes golongan is in the fifth column
  const jabatan = pegawaiData.find(pegawai => pegawai[0] === nama)[5]; // Assumes jabatan is in the sixth column

  const formData = {
    nama,
    nip,
    subbid,
    status,
    golongan,
    jabatan,
  };

  for (let i = 1; i <= 7; i++) {
    formData[`sesi${i}`] = document.getElementById(`sesi${i}`).value;
    formData[`bukti${i}`] = document.getElementById(`bukti${i}`).files[0] ? document.getElementById(`bukti${i}`).files[0].name : '';  // Assume the file name is enough for now
  }

  const statusMessage = document.getElementById('statusMessage');

  // Check if any session has been submitted already
  if (Object.values(laporanData).some(value => value)) {
    statusMessage.innerText = 'Anda sudah mengirim laporan hari ini. Tidak bisa mengirim ulang.';
    statusMessage.style.color = 'red';
    return;
  }

  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'submitForm', data: formData }),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(response => response.text())
    .then(data => {
      if (data === 'OK') {
        statusMessage.innerText = 'Laporan berhasil dikirim!';
        statusMessage.style.color = 'green';
        getLaporan();  // Update form status after successful submit
      } else {
        statusMessage.innerText = 'Terjadi kesalahan saat mengirim laporan.';
        statusMessage.style.color = 'red';
      }
    })
    .catch(error => {
      console.error('Error submitting form:', error);
      statusMessage.innerText = 'Terjadi kesalahan saat mengirim laporan.';
      statusMessage.style.color = 'red';
    });
}

document.getElementById('nama').addEventListener('change', getLaporan);
document.getElementById('submitBtn').addEventListener('click', submitForm);

// Load pegawai data on page load
window.onload = getPegawai;
