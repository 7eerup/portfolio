// ====================
// API 설정
// GitHub 저장소 목록과 Formspree 폼 전송에 사용
// ====================

const GITHUB_USERNAME = "7eerup";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mjgzjoyl";

// ====================
// 상태(state)
// 화면에 표시될 데이터와 현재 UI 상태를 저장
// ====================

const state = {
  // 저장된 테마가 있으면 우선 사용, 없으면 시스템 다크모드 설정 감지
  theme:
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"),

  // 사용자가 직접 테마 버튼을 눌렀는지 구분
  themeChangedByUser: false,

  // GitHub API에서 받아온 전체 프로젝트 목록
  projects: [],

  // 현재 필터 조건에 맞는 프로젝트 목록
  filteredProjects: [],

  // 프로젝트 요청 상태: loading, success, error
  projectStatus: "loading",

  // API 에러 메시지 저장
  projectError: "",

  // 현재 선택된 프로젝트 언어 필터
  currentFilter: "all",

  // 문의 폼 에러 상태
  formErrors: {
    name: "",
    email: "",
    message: "",
  },
};

// ====================
// DOM 요소 선택
// HTML 요소를 JavaScript에서 제어하기 위해 선택
// ====================

const header = document.querySelector(".header");
const menuToggle = document.querySelector(".menu-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const themeToggle = document.querySelector(".theme-toggle");
const scrollTopButton = document.querySelector(".scroll-top");
const typingText = document.querySelector(".typing-text");

const projectGrid = document.querySelector(".project-grid");
const projectStatus = document.querySelector(".project-status");
const projectFilter = document.querySelector(".project-filter");

const contactForm = document.querySelector(".contact-form");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const messageInput = document.querySelector("#message");
const nameError = document.querySelector("#nameError");
const emailError = document.querySelector("#emailError");
const messageError = document.querySelector("#messageError");
const formSuccess = document.querySelector(".form-success");

// ====================
// 테마 관련 함수
// 다크모드 / 라이트모드 상태를 화면에 반영
// ====================

const setTheme = () => {
  // html 태그의 data-theme 값을 변경하여 CSS 변수 적용
  document.documentElement.dataset.theme = state.theme;

  // 사용자가 직접 테마를 변경한 경우에만 localStorage 저장
  if (state.themeChangedByUser) {
    localStorage.setItem("theme", state.theme);
  }

  // 현재 테마에 따라 버튼 문구 변경
  themeToggle.textContent =
    state.theme === "dark" ? "라이트 모드" : "다크 모드";
};

const toggleTheme = () => {
  // 현재 테마 상태를 반대로 변경
  state.theme = state.theme === "dark" ? "light" : "dark";

  // 사용자가 직접 변경했다는 상태 저장
  state.themeChangedByUser = true;

  // 변경된 상태를 화면에 반영
  setTheme();
};

// ====================
// 네비게이션 / 스크롤 관련 함수
// 햄버거 메뉴, 스크롤 탑 버튼, 헤더 스타일 제어
// ====================

const toggleMenu = () => {
  // 모바일 메뉴 열기 / 닫기
  navMenu.classList.toggle("active");
};

const closeMenu = () => {
  // 메뉴 링크 클릭 시 모바일 메뉴 닫기
  navMenu.classList.remove("active");
};

const handleScroll = () => {
  // 60px 이상 스크롤하면 헤더에 그림자 스타일 추가
  if (window.scrollY >= 60) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }

  // 300px 이상 스크롤하면 맨 위로 버튼 표시
  if (window.scrollY >= 300) {
    scrollTopButton.classList.add("active");
  } else {
    scrollTopButton.classList.remove("active");
  }
};

const scrollToTop = () => {
  // 페이지 맨 위로 부드럽게 이동
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

// ====================
// 프로젝트 필터링 함수
// GitHub 프로젝트를 언어별로 필터링
// ====================

const getFilteredProjects = () => {
  // 전체 필터일 경우 모든 프로젝트 반환
  if (state.currentFilter === "all") {
    return state.projects;
  }

  // array.filter()로 선택한 언어와 일치하는 프로젝트만 반환
  return state.projects.filter((project) => {
    const language = project.language || "";
    return language.toLowerCase() === state.currentFilter;
  });
};

const renderFilterButtons = () => {
  // GitHub 프로젝트에서 language 값만 추출
  const languages = state.projects
    .map((project) => project.language)
    .filter((language) => language);

  // Set으로 중복 언어 제거 후 전체(all) 버튼 추가
  const uniqueLanguages = ["all", ...new Set(languages)];

  // 언어 목록을 버튼 HTML로 변환
  projectFilter.innerHTML = uniqueLanguages
    .map((language) => {
      const filterValue = language.toLowerCase();
      const label = language === "all" ? "전체" : language;

      return `
        <button
          type="button"
          class="filter-btn ${state.currentFilter === filterValue ? "active" : ""}"
          data-filter="${filterValue}"
        >
          ${label}
        </button>
      `;
    })
    .join("");

  // 동적으로 생성된 필터 버튼에 클릭 이벤트 연결
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setFilter(button.dataset.filter);
    });
  });
};

const createProjectCard = (project) => {
  // 구조분해 할당으로 프로젝트 객체에서 필요한 값 추출
  const { name, description, html_url, language, stargazers_count } = project;

  // 프로젝트 카드 HTML 생성
  return `
    <article class="project-card">
      <h3>${name}</h3>
      <p>${description || "프로젝트 설명이 없습니다."}</p>
      <p>사용 언어: ${language || "없음"}</p>
      <p>⭐ ${stargazers_count}</p>
      <a href="${html_url}" target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
    </article>
  `;
};

const renderProjects = () => {
  // 기존 프로젝트 카드 초기화
  projectGrid.innerHTML = "";

  // 로딩 상태 UI
  if (state.projectStatus === "loading") {
    projectStatus.textContent = "프로젝트 로딩 중...";
    return;
  }

  // 에러 상태 UI
  if (state.projectStatus === "error") {
    projectStatus.innerHTML = `
      <p>프로젝트를 불러올 수 없습니다.</p>
      <button type="button" class="btn retry-btn">재시도</button>
    `;

    // 재시도 버튼 클릭 시 API 다시 호출
    const retryButton = document.querySelector(".retry-btn");
    retryButton.addEventListener("click", fetchProjects);
    return;
  }

  // 현재 필터 상태에 맞는 프로젝트만 가져오기
  const projects = getFilteredProjects();
  state.filteredProjects = projects;

  // 빈 상태 UI
  if (projects.length === 0) {
    projectStatus.textContent = "표시할 프로젝트가 없습니다.";
    return;
  }

  // 성공 상태 UI
  projectStatus.textContent = `${projects.length}개의 프로젝트를 표시합니다.`;

  // map()으로 프로젝트 배열을 카드 HTML로 변환 후 화면 출력
  projectGrid.innerHTML = projects.map(createProjectCard).join("");
};

const fetchProjects = async () => {
  try {
    // 요청 시작 전 로딩 상태로 변경
    state.projectStatus = "loading";
    renderProjects();

    // GitHub API 호출
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`,
    );

    // 응답 실패 시 에러 발생
    if (!response.ok) {
      throw new Error("GitHub API 요청 실패");
    }

    // JSON 데이터 변환
    const data = await response.json();

    // 성공 상태 저장
    state.projects = data;
    state.projectStatus = "success";

    // 필터 버튼과 프로젝트 목록 렌더링
    renderFilterButtons();
    renderProjects();
  } catch (error) {
    // 실패 상태 저장
    state.projectStatus = "error";
    state.projectError = error.message;

    // 에러 UI 렌더링
    renderProjects();
  }
};

const setFilter = (filterValue) => {
  // 선택한 필터 상태 변경
  state.currentFilter = filterValue;

  // 버튼 active 상태와 프로젝트 카드 다시 렌더링
  renderFilterButtons();
  renderProjects();
};

// ====================
// 문의 폼 관련 함수
// 입력값 검증, 에러 표시, Formspree 전송
// ====================

const validateForm = () => {
  // 기존 에러 상태 초기화
  state.formErrors = {
    name: "",
    email: "",
    message: "",
  };

  // 입력값 공백 제거
  const nameValue = nameInput.value.trim();
  const emailValue = emailInput.value.trim();
  const messageValue = messageInput.value.trim();

  // 이메일 형식 검사 정규식
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // 이름 필수값 검사
  if (!nameValue) {
    state.formErrors.name = "이름을 입력하세요.";
  }

  // 이메일 필수값 및 형식 검사
  if (!emailValue) {
    state.formErrors.email = "이메일을 입력하세요.";
  } else if (!emailPattern.test(emailValue)) {
    state.formErrors.email = "올바른 이메일 형식이 아닙니다.";
  }

  // 메시지 필수값 검사
  if (!messageValue) {
    state.formErrors.message = "메시지를 입력하세요.";
  }

  // 에러가 하나도 없으면 true 반환
  return Object.values(state.formErrors).every((error) => error === "");
};

const renderFormErrors = () => {
  // 상태에 저장된 에러 메시지를 DOM에 표시
  nameError.textContent = state.formErrors.name;
  emailError.textContent = state.formErrors.email;
  messageError.textContent = state.formErrors.message;
};

const handleFormInput = () => {
  // 입력할 때마다 실시간 검증
  validateForm();
  renderFormErrors();

  // 입력 중에는 성공 메시지 제거
  formSuccess.textContent = "";
};

const handleFormSubmit = async (event) => {
  // 기본 폼 제출 동작 방지
  event.preventDefault();

  // 제출 전 유효성 검사
  const isValid = validateForm();
  renderFormErrors();

  // 유효하지 않으면 전송 중단
  if (!isValid) {
    formSuccess.textContent = "";
    return;
  }

  try {
    // 전송 중 상태 표시
    formSuccess.textContent = "전송 중입니다...";

    // 폼 데이터를 FormData 객체로 변환
    const formData = new FormData(contactForm);

    // Formspree로 폼 데이터 전송
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    // 전송 실패 시 에러 발생
    if (!response.ok) {
      throw new Error("폼 전송 실패");
    }

    // 성공 메시지 표시 후 폼 초기화
    formSuccess.textContent = "문의가 성공적으로 전송되었습니다.";
    contactForm.reset();
  } catch (error) {
    // 실패 메시지 표시
    formSuccess.textContent =
      "문의 전송에 실패했습니다. 잠시 후 다시 시도하세요.";
  }
};

// ====================
// 애니메이션 함수
// 스크롤 등장 효과와 Hero 타이핑 효과
// ====================

const initScrollAnimation = () => {
  // 모든 section 요소 선택
  const revealElements = document.querySelectorAll(".section");

  // section에 reveal 클래스 추가
  revealElements.forEach((element) => {
    element.classList.add("reveal");
  });

  // 화면에 20% 이상 보이면 active 클래스 추가
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    },
    {
      threshold: 0.2,
    },
  );

  // 각 section 감시 시작
  revealElements.forEach((element) => {
    observer.observe(element);
  });
};

const startTypingEffect = () => {
  // Hero 섹션에 한 글자씩 표시할 문구
  const text = "AI Software Engineer";
  let index = 0;

  const typing = () => {
    // 0부터 index까지 문자열을 잘라 화면에 표시
    typingText.textContent = text.slice(0, index);
    index += 1;

    // 아직 표시할 글자가 남아 있으면 반복
    if (index <= text.length) {
      setTimeout(typing, 80);
    }
  };

  // 타이핑 시작
  typing();
};

// ====================
// 이벤트 연결
// HTML 요소에 사용자 이벤트 연결
// ====================

// 햄버거 버튼 클릭 시 메뉴 열기/닫기
menuToggle.addEventListener("click", toggleMenu);

// 다크모드 버튼 클릭 시 테마 변경
themeToggle.addEventListener("click", toggleTheme);

// 시스템 다크모드 설정 감지
const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");

systemThemeMedia.addEventListener("change", (event) => {
  const savedTheme = localStorage.getItem("theme");

  // 사용자가 직접 선택한 테마가 있으면 시스템 설정 무시
  if (savedTheme) {
    return;
  }

  // 시스템 설정에 따라 테마 변경
  state.theme = event.matches ? "dark" : "light";
  setTheme();
});

// 스크롤 이벤트 연결
window.addEventListener("scroll", handleScroll);

// 맨 위로 버튼 클릭 이벤트
scrollTopButton.addEventListener("click", scrollToTop);

// 모바일 메뉴 링크 클릭 시 메뉴 닫기
navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

// 폼 제출 이벤트
contactForm.addEventListener("submit", handleFormSubmit);

// 폼 입력 이벤트
contactForm.addEventListener("input", handleFormInput);

// ====================
// 초기 실행
// 페이지가 처음 로드될 때 실행되는 함수들
// ====================

// 현재 테마 적용
setTheme();

// 현재 스크롤 위치 기준 UI 초기화
handleScroll();

// 스크롤 애니메이션 초기화
initScrollAnimation();

// Hero 타이핑 효과 실행
startTypingEffect();

// GitHub 프로젝트 데이터 요청
fetchProjects();
