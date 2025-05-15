const API_URL = "https://script.google.com/macros/s/AKfycbyU_i8_6tvnhdvPp-CGpcjUs8Uape1vOFEs836vI4RrHNnQLp30Vt0vcH8y3oSY770oeA/exec";

document.addEventListener("DOMContentLoaded", async () => {
  await loadPegawai();
  setupSesiFields();
});

async function loadPegawai() {
  const response = await fetch(`${API_URL}?action=getPegawai`);
  const data = await response.json();
  const select = document.getElementById("nama");
  data.forEach(row => {
    const option = document.createElement("option");
    option.value = row[0];
    option.textContent = row[0];
    select.appendChild(option);
  });
  window.dataPegawai = data;
}

document.getElementById("nama").addEventListener("change", async () => {
  const nama = document.getElementById("nama").value;
  const data = window.dataPegawai.find(row => row[0] === nama);
  if (data) {
    document.getElementById("nip").textContent = data[2];
    document.getElementById("subbid").textContent = data[3];
    document.getElementById("status").textContent = data[4];
    document.getElementById("golongan").textContent = data[5];
    document.getElementById("jabatan").textContent = data[6];
    document.getElementById("detailPegawai").style.display = "block";

    const response = await fetch(`${API_URL}?action=checkLaporan&nama=${encodeURIComponent(nama)}`);
    const result = await response.json();

    if (!result.submitted) {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(22, 0, 0, 0); // jam 22:00

      const timeLeft = cutoff - now;
      if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        Swal.fire({
          icon: "info",
          title: "Belum Mengisi Laporan",
          html: `Anda belum mengisi laporan hari ini.<br><b>Waktu tersisa:</b> ${hours} jam ${minutes} menit`,
          confirmButtonText: "Isi Sekarang"
        });
      } else {
        Swal.fire({
          icon: "warning",
          title: "Waktu Pengisian Berakhir",
          text: "Formulir hanya bisa diisi antara pukul 08.00 hingga 22.00 WIB.",
          confirmButtonText: "OK"
        });
      }
    }
  }
});

function setupSesiFields() {
  const sesiContainer = document.getElementById("sesiContainer");
  for (let i = 1; i <= 7; i++) {
    const div = document.createElement("div");
    div.className = "mb-3";
    div.innerHTML = `
      <label class="form-label">Sesi ${i}</label>
      <input type="text" id="sesi${i}" class="form-control mb-1" placeholder="Uraian kegiatan">
      <input type="file" id="bukti${i}" class="form-control" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx">
    `;
    sesiContainer.appendChild(div);
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById("btnSubmit").addEventListener("click", async (event) => {
  event.preventDefault();
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (day === 0 || day === 6) {
    return Swal.fire("Hari Libur!", "Laporan hanya bisa dikirim Senin–Jumat.", "info");
  }

  const currentMinutes = hours * 60 + minutes;
  if (currentMinutes < 480 || currentMinutes > 1320) {
    return Swal.fire("Di Luar Jam!", "Laporan hanya bisa dikirim antara pukul 08.00–22.00.", "info");
  }

  const nama = document.getElementById("nama").value;
  if (!nama) return Swal.fire("Pilih Nama!", "Pilih nama pegawai terlebih dahulu.", "warning");

  const pegawai = window.dataPegawai.find(row => row[0] === nama);
  const data = {
    nama: pegawai[0],
    nip: pegawai[2],
    subbid: pegawai[3],
    status: pegawai[4],
    golongan: pegawai[5],
    jabatan: pegawai[6]
  };

  let adaIsi = false;

  for (let i = 1; i <= 7; i++) {
    const uraian = document.getElementById(`sesi${i}`).value;
    data[`sesi${i}`] = uraian;
    if (uraian.trim() !== "") adaIsi = true;

    const fileInput = document.getElementById(`bukti${i}`);
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const base64 = await toBase64(file);
      const upload = await fetch(`${API_URL}?action=uploadFile`, {
        method: "POST",
        body: JSON.stringify({ base64, filename: file.name })
      });
      const fileUrl = await upload.text();
      data[`bukti${i}`] = fileUrl;
    } else {
      data[`bukti${i}`] = "";
    }
  }

  if (!adaIsi) {
    return Swal.fire("Kosong!", "Minimal isi satu sesi kegiatan.", "warning");
  }

  const submit = await fetch(`${API_URL}?action=submitForm`, {
    method: "POST",
    body: JSON.stringify(data)
  });

  const responseText = await submit.text();

  if (responseText === "OK") {
    Swal.fire({
    icon: 'success',
    title: 'Laporan berhasil dikirim!',
    showConfirmButton: false,
    timer: 2000
  }).then(() => {
    document.getElementById("laporanForm").reset();
    document.getElementById("detailPegawai").style.display = "none";
    location.href = location.pathname;
    });
  } else if (responseText === "DUPLICATE") {
    Swal.fire("Duplikat!", "Anda sudah mengisi laporan hari ini.", "warning");
  } else if (responseText === "HARI_LIBUR") {
    Swal.fire("Hari Libur!", "Laporan hanya dapat dikirim pada hari kerja (Senin–Jumat).", "info");
  } else if (responseText === "DI_LUAR_JAM") {
    Swal.fire("Di Luar Jam!", "Laporan hanya dapat dikirim antara pukul 08.00–22.00.", "info");
  } else {
    Swal.fire("Gagal!", "Terjadi kesalahan saat mengirim laporan.", "error");
  }
});
function validateAccessPin() {
  const allowedPins = ["1234", "4567", "8901"]; // daftar PIN
  const inputPin = document.getElementById("accessPin").value;

  if (allowedPins.includes(inputPin)) {
    document.getElementById("pinOverlay").style.display = "none"; // ini penting
  } else {
    document.getElementById("pinError").style.display = "block";
  }
}


