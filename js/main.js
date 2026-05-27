const GITHUB_USERNAME = '7eerup';

const state = {
  theme: localStorage.getItem('theme') || 'light',
  projects: [],
  filteredProjects: [],
  projectStatus: 'loading',
  projectError: '',
  currentFilter: 'all',
  formErrors: {
    name: '',
    email: '',
    message: '',
  },
};

const header = document.querySelector('.header');
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-menu a');
const themeToggle = document.querySelector('.theme-toggle');
const scrollTopButton = document.querySelector('.scroll-top');

const projectGrid = document.querySelector('.project-grid');
const projectStatus = document.querySelector('.project-status');
const filterButtons = document.querySelectorAll('.filter-btn');

const contactForm = document.querySelector('.contact-form');
const nameInput = document.querySelector('#name');
const emailInput = document.querySelector('#email');
const messageInput = document.querySelector('#message');
const nameError = document.querySelector('#nameError');
const emailError = document.querySelector('#emailError');
const messageError = document.querySelector('#messageError');
const formSuccess = document.querySelector('.form-success');

const setTheme = () => {
  document.documentElement.dataset.theme = state.theme;
  localStorage.setItem('theme', state.theme);

  themeToggle.textContent =
    state.theme === 'dark' ? '라이트 모드' : '다크 모드';
};

const toggleTheme = () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  setTheme();
};

const toggleMenu = () => {
  navMenu.classList.toggle('active');
};

const closeMenu = () => {
  navMenu.classList.remove('active');
};

const handleScroll = () => {
  if (window.scrollY >= 60) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }

  if (window.scrollY >= 300) {
    scrollTopButton.classList.add('active');
  } else {
    scrollTopButton.classList.remove('active');
  }
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

const getFilteredProjects = () => {
  if (state.currentFilter === 'all') {
    return state.projects;
  }

  return state.projects.filter((project) => {
    const language = project.language || '';
    return language.toLowerCase() === state.currentFilter;
  });
};

const createProjectCard = (project) => {
  const { name, description, html_url, language, stargazers_count } = project;

  return `
    <article class="project-card">
      <h3>${name}</h3>
      <p>${description || '프로젝트 설명이 없습니다.'}</p>
      <p>사용 언어: ${language || '없음'}</p>
      <p>⭐ ${stargazers_count}</p>
      <a href="${html_url}" target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
    </article>
  `;
};

const renderProjects = () => {
  projectGrid.innerHTML = '';

  if (state.projectStatus === 'loading') {
    projectStatus.textContent = '프로젝트 로딩 중...';
    return;
  }

  if (state.projectStatus === 'error') {
    projectStatus.innerHTML = `
      <p>프로젝트를 불러올 수 없습니다.</p>
      <button type="button" class="btn retry-btn">재시도</button>
    `;

    const retryButton = document.querySelector('.retry-btn');
    retryButton.addEventListener('click', fetchProjects);
    return;
  }

  const projects = getFilteredProjects();
  state.filteredProjects = projects;

  if (projects.length === 0) {
    projectStatus.textContent = '표시할 프로젝트가 없습니다.';
    return;
  }

  projectStatus.textContent = `${projects.length}개의 프로젝트를 표시합니다.`;
  projectGrid.innerHTML = projects.map(createProjectCard).join('');
};

const fetchProjects = async () => {
  try {
    state.projectStatus = 'loading';
    renderProjects();

    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`
    );

    if (!response.ok) {
      throw new Error('GitHub API 요청 실패');
    }

    const data = await response.json();

    state.projects = data;
    state.projectStatus = 'success';
    renderProjects();
  } catch (error) {
    state.projectStatus = 'error';
    state.projectError = error.message;
    renderProjects();
  }
};

const setFilter = (filterValue) => {
  state.currentFilter = filterValue;

  filterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === filterValue);
  });

  renderProjects();
};

const validateForm = () => {
  state.formErrors = {
    name: '',
    email: '',
    message: '',
  };

  const nameValue = nameInput.value.trim();
  const emailValue = emailInput.value.trim();
  const messageValue = messageInput.value.trim();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!nameValue) {
    state.formErrors.name = '이름을 입력하세요.';
  }

  if (!emailValue) {
    state.formErrors.email = '이메일을 입력하세요.';
  } else if (!emailPattern.test(emailValue)) {
    state.formErrors.email = '올바른 이메일 형식이 아닙니다.';
  }

  if (!messageValue) {
    state.formErrors.message = '메시지를 입력하세요.';
  }

  return Object.values(state.formErrors).every((error) => error === '');
};

const renderFormErrors = () => {
  nameError.textContent = state.formErrors.name;
  emailError.textContent = state.formErrors.email;
  messageError.textContent = state.formErrors.message;
};

const handleFormInput = () => {
  validateForm();
  renderFormErrors();
  formSuccess.textContent = '';
};

const handleFormSubmit = (event) => {
  event.preventDefault();

  const isValid = validateForm();
  renderFormErrors();

  if (!isValid) {
    formSuccess.textContent = '';
    return;
  }

  formSuccess.textContent = '문의가 성공적으로 제출되었습니다.';
  contactForm.reset();
};

const initScrollAnimation = () => {
  const revealElements = document.querySelectorAll('.section');

  revealElements.forEach((element) => {
    element.classList.add('reveal');
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    },
    {
      threshold: 0.2,
    }
  );

  revealElements.forEach((element) => {
    observer.observe(element);
  });
};

menuToggle.addEventListener('click', toggleMenu);
themeToggle.addEventListener('click', toggleTheme);
window.addEventListener('scroll', handleScroll);
scrollTopButton.addEventListener('click', scrollToTop);

navLinks.forEach((link) => {
  link.addEventListener('click', closeMenu);
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setFilter(button.dataset.filter);
  });
});

contactForm.addEventListener('submit', handleFormSubmit);
contactForm.addEventListener('input', handleFormInput);

setTheme();
handleScroll();
initScrollAnimation();
fetchProjects();