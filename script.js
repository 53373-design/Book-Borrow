// ============================================
// Library Manager Pro — Supabase Edition
// ============================================
// 1) แก้ SUPABASE_URL และ SUPABASE_ANON_KEY ด้านล่างให้เป็นของโปรเจกต์คุณ
// 2) รันตาราง books ตาม SQL schema ที่ให้ไว้ก่อนหน้านี้ใน Supabase SQL editor
// ============================================

const SUPABASE_URL = 'https://pbegefcgxjplumcuzwbt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_b6yFLkDl61RtepfqewHqDw_QITX4-ji';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let books = [];

// ---------- Helpers ----------
function setLoading(isLoading) {
  const grid = document.getElementById('booksGrid');
  if (isLoading) {
    grid.innerHTML = `
      <div class="col-span-full flex items-center justify-center py-16 text-slate-500">
        <i class="fa-solid fa-spinner fa-spin text-2xl mr-3"></i> กำลังโหลดข้อมูล...
      </div>`;
  }
}

function showError(message) {
  const grid = document.getElementById('booksGrid');
  grid.innerHTML = `
    <div class="col-span-full bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl p-5 text-sm">
      <i class="fa-solid fa-triangle-exclamation mr-2"></i> ${message}
    </div>`;
}

// ---------- Fetch all books ----------
async function fetchBooks() {
  setLoading(true);
  const { data, error } = await supabaseClient
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    showError('โหลดข้อมูลไม่สำเร็จ: ' + error.message);
    return;
  }

  books = data.map(row => ({
    id: row.id,
    title: row.title,
    author: row.author,
    isBorrowed: row.is_borrowed,
    borrower: row.borrower || '',
    borrowDate: row.borrow_date || ''
  }));

  render();
}

// ---------- Render ----------
function render() {
  const booksGrid = document.getElementById('booksGrid');
  const totalCount = document.getElementById('totalCount');
  const availableCount = document.getElementById('availableCount');
  const borrowedCount = document.getElementById('borrowedCount');

  totalCount.textContent = books.length;
  availableCount.textContent = books.filter(b => !b.isBorrowed).length;
  borrowedCount.textContent = books.filter(b => b.isBorrowed).length;

  if (books.length === 0) {
    booksGrid.innerHTML = `
      <div class="col-span-full text-center py-16 text-slate-500 text-sm">
        <i class="fa-regular fa-folder-open text-3xl mb-3 block"></i>
        ยังไม่มีหนังสือในคลัง ลองเพิ่มรายการใหม่ด้านบน
      </div>`;
    return;
  }

  booksGrid.innerHTML = books.map(book => `
    <div class="bg-slate-800 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
      <div>
        <div class="flex justify-between items-start gap-2 mb-3">
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase border ${
            book.isBorrowed ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }">
            ${book.isBorrowed ? 'ถูกยืม' : 'ว่าง'}
          </span>
          <button onclick="deleteBook(${book.id})" class="text-slate-500 hover:text-rose-400 p-1">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
        <h3 class="font-bold text-lg text-slate-100 mb-2">${book.title}</h3>

        <!-- ช่องแก้ไขชื่อผู้แต่ง -->
        <div class="flex items-center gap-1.5 mb-4 text-sm text-slate-400">
          <i class="fa-regular fa-user text-xs"></i>
          <input type="text" value="${book.author}" onchange="updateAuthor(${book.id}, this.value)"
                 class="bg-transparent hover:bg-slate-900 focus:bg-slate-900 border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-1.5 py-0.5 text-slate-300 focus:text-white text-sm transition-all focus:outline-none w-full"
                 title="คลิกเพื่อแก้ไขชื่อผู้แต่ง">
        </div>
      </div>

      <div class="pt-4 border-t border-slate-700/50">
        ${book.isBorrowed ? `
          <div class="mb-3 bg-slate-900/60 p-2.5 rounded-xl text-xs space-y-1">
            <p class="text-slate-400">ผู้ยืม: <span class="text-slate-200 font-medium">${book.borrower}</span></p>
            <p class="text-slate-500 text-[11px]">วันที่ยืม: ${book.borrowDate}</p>
          </div>
          <button onclick="returnBook(${book.id})" class="w-full py-2 bg-slate-700 hover:bg-amber-600 text-slate-200 rounded-xl text-sm font-semibold transition-all">
            คืนหนังสือ
          </button>
        ` : `
          <div class="space-y-2">
            <input id="input-borrower-${book.id}" type="text" placeholder="พิมพ์ชื่อผู้ยืม..." class="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
            <button onclick="borrowBook(${book.id})" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-600/20">
              ยืนยันยืม
            </button>
          </div>
        `}
      </div>
    </div>
  `).join('');
}

// ---------- Update author ----------
window.updateAuthor = async function (id, newAuthor) {
  const author = newAuthor.trim() || 'ไม่ระบุผู้แต่ง';
  const book = books.find(b => b.id === id);
  if (book) book.author = author; // optimistic update

  const { error } = await supabaseClient
    .from('books')
    .update({ author })
    .eq('id', id);

  if (error) {
    console.error(error);
    alert('อัปเดตชื่อผู้แต่งไม่สำเร็จ: ' + error.message);
    fetchBooks();
  }
};

// ---------- Borrow ----------
window.borrowBook = async function (id) {
  const input = document.getElementById(`input-borrower-${id}`);
  const name = input ? input.value.trim() : '';

  if (!name) {
    alert('กรุณาพิมพ์ชื่อผู้ยืมก่อนครับ');
    return;
  }

  const borrowDate = new Date().toISOString().split('T')[0];

  const { error } = await supabaseClient
    .from('books')
    .update({
      is_borrowed: true,
      borrower: name,
      borrow_date: borrowDate
    })
    .eq('id', id);

  if (error) {
    console.error(error);
    alert('ยืมหนังสือไม่สำเร็จ: ' + error.message);
    return;
  }

  await fetchBooks();
};

// ---------- Return ----------
window.returnBook = async function (id) {
  const { error } = await supabaseClient
    .from('books')
    .update({
      is_borrowed: false,
      borrower: null,
      borrow_date: null
    })
    .eq('id', id);

  if (error) {
    console.error(error);
    alert('คืนหนังสือไม่สำเร็จ: ' + error.message);
    return;
  }

  await fetchBooks();
};

// ---------- Delete ----------
window.deleteBook = async function (id) {
  const ok = confirm('ต้องการลบหนังสือเล่มนี้ออกจากคลังใช่หรือไม่?');
  if (!ok) return;

  const { error } = await supabaseClient
    .from('books')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(error);
    alert('ลบหนังสือไม่สำเร็จ: ' + error.message);
    return;
  }

  await fetchBooks();
};

// ---------- Add new book ----------
document.getElementById('confirmAddBtn').addEventListener('click', async () => {
  const titleInput = document.getElementById('addTitleInput');
  const authorInput = document.getElementById('addAuthorInput');
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();

  if (!title || !author) {
    alert('กรุณากรอกชื่อหนังสือและชื่อผู้แต่งให้ครบถ้วน');
    return;
  }

  const { error } = await supabaseClient
    .from('books')
    .insert({
      title,
      author,
      is_borrowed: false,
      borrower: null,
      borrow_date: null
    });

  if (error) {
    console.error(error);
    alert('เพิ่มหนังสือไม่สำเร็จ: ' + error.message);
    return;
  }

  titleInput.value = '';
  authorInput.value = '';
  await fetchBooks();
});

// ---------- Realtime sync (อัปเดตแบบเรียลไทม์เมื่อมีคนอื่นแก้ข้อมูล) ----------
supabaseClient
  .channel('books-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
    fetchBooks();
  })
  .subscribe();

// ---------- Init ----------
fetchBooks();