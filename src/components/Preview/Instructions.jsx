import React from 'react';
import useCardStore from '../../store/useCardStore';
import { getMechanism } from '../../generators/registry';
import { Scissors, Palette, Tent, HelpCircle } from 'lucide-react';

export default function Instructions() {
  const { cardParams } = useCardStore();

  if (!cardParams) {
    return (
      <div className="preview-content" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
        도안 생성을 완료하면 이곳에 조립 설명서가 나타납니다.
      </div>
    );
  }

  const renderSteps = () => {
    const instructionStyle = getMechanism(cardParams.mechanism)?.instructionStyle;

    switch (instructionStyle) {
      case 'straw-rocket':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>오리기</h4>
                <p>검은색 실선을 따라 튜브 모양과 장식 그림을 조심해서 오려주세요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <rect x="20" y="10" width="20" height="40" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeDasharray="4 2" />
                    <circle cx="70" cy="30" r="15" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeDasharray="4 2" />
                    <path d="M10 50 L30 30 M30 50 L10 30" stroke="var(--primary-main)" strokeWidth="2" /> {/* Scissors */}
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>튜브 말아 붙이기</h4>
                <p>가장 긴 네모(튜브)를 둥글게 말아서 '풀칠' 부분에 풀이나 양면테이프를 발라 원통 모양으로 붙여주세요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* Isometric cylinder representing rolled tube */}
                    <ellipse cx="50" cy="15" rx="15" ry="5" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <path d="M35 15 L35 45 A15 5 0 0 0 65 45 L65 15 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <ellipse cx="50" cy="45" rx="15" ry="5" fill="none" stroke="var(--text-primary)" strokeWidth="1" />
                    <path d="M40 30 L60 30" stroke="var(--primary-main)" strokeWidth="2" strokeDasharray="2 2" /> {/* Glue indicator */}
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>윗부분 막기</h4>
                <p>튜브 위쪽의 작은 날개를 산접기(빨간 점선)하여 뚜껑을 덮듯 풀칠해 막아주세요. (바람이 새지 않게 꼼꼼히!)</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <path d="M35 25 L35 55 A15 5 0 0 0 65 55 L65 25 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <ellipse cx="50" cy="25" rx="15" ry="5" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1" /> {/* Closed top */}
                    <path d="M50 15 L50 25" stroke="red" strokeWidth="2" /> {/* Arrow pointing down */}
                    <path d="M45 20 L50 25 L55 20" fill="none" stroke="red" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">4</div>
              <div className="step-content">
                <h4>장식 붙이고 날리기!</h4>
                <p>완성된 튜브 앞/뒷면에 장식을 붙인 후, 아래 뚫린 구멍으로 일반 빨대를 꽂고 후~ 불어보세요!</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="160" viewBox="0 0 100 80" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* Straw */}
                    <path d="M50 40 L50 75" stroke="var(--primary-main)" strokeWidth="4" />
                    {/* Tube flying off */}
                    <path d="M35 15 L35 35 A15 5 0 0 0 65 35 L65 15 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <ellipse cx="50" cy="15" rx="15" ry="5" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1" />
                    {/* Decoration star */}
                    <path d="M50 20 L53 27 L60 27 L55 32 L57 39 L50 35 L43 39 L45 32 L40 27 L47 27 Z" fill="gold" stroke="orange" strokeWidth="1" />
                    {/* Air lines */}
                    <path d="M30 50 Q 20 40 30 30" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeDasharray="3 3" />
                    <path d="M70 50 Q 80 40 70 30" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeDasharray="3 3" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        );
      
      case 'accordion':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>지그재그 띠 오리기</h4>
                <p>검은색 실선을 따라 띠를 오려주세요. 위아래 초록색(풀칠) 부분은 자르지 말고 남겨둡니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <rect x="35" y="6" width="30" height="48" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeDasharray="4 2" />
                    <rect x="35" y="6" width="30" height="8" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <rect x="35" y="46" width="30" height="8" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <path d="M10 50 L30 30 M30 50 L10 30" stroke="var(--primary-main)" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>병풍처럼 접기</h4>
                <p>빨간 점선은 산접기, 파란 점선은 골접기로 번갈아 접어 지그재그를 만드세요. 붙이기 전에 반대 방향으로도 한 번 살짝 접어두면 잘 펴집니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="100" viewBox="0 0 120 40" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    <path d="M10 30 L25 10 L40 30 L55 10 L70 30 L85 10 L100 30" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
                    <path d="M25 10 L25 6 M55 10 L55 6 M85 10 L85 6" stroke="red" strokeWidth="1.5" />
                    <path d="M40 30 L40 34 M70 30 L70 34" stroke="blue" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>양 끝만 붙이기</h4>
                <p>카드를 반쯤 연 상태에서 위 '풀칠' 칸은 위 종이면에, 아래 '풀칠' 칸은 아래 종이면에 붙이세요. 가운데는 붙이지 마세요! 카드를 열면 병풍이 짠 하고 섭니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="140" viewBox="0 0 100 70" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <path d="M15 20 L50 40 L85 20" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M28 30 L38 15 L48 33 L58 15 L68 33 L72 27" fill="none" stroke="var(--primary-main)" strokeWidth="2" />
                    <circle cx="28" cy="30" r="2.5" fill="green" />
                    <circle cx="72" cy="27" r="2.5" fill="green" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        );

      case 'volvelle':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>동그란 판 4개 오리기</h4>
                <p>덮개·돌림판·간격 링·뒷판을 실선대로 오려주세요. 덮개의 창문 구멍과 손잡이 홈도 함께 오려냅니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                  <svg width="200" height="120" viewBox="0 0 120 60" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    <circle cx="30" cy="30" r="22" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
                    <path d="M30 30 L22 10 A22 22 0 0 1 38 10 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M23 50 A22 22 0 0 0 37 50 L34 44 A14 14 0 0 1 26 44 Z" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <circle cx="85" cy="30" r="18" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
                    <path d="M85 30 L85 12 M85 30 L100 38 M85 30 L70 38" stroke="var(--text-primary)" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>뒷판 + 간격 링 붙이기</h4>
                <p>뒷판 위에 간격 링을 겹쳐 초록색 테두리끼리 붙이세요. 가운데 구멍은 뚫린 채로 둡니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <circle cx="50" cy="30" r="24" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <circle cx="50" cy="30" r="24" fill="none" stroke="green" strokeWidth="2" strokeDasharray="2 2" />
                    <circle cx="50" cy="30" r="16" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>돌림판은 끼우기만! (붙이지 마세요)</h4>
                <p>그림을 그린 돌림판을 링 구멍 안에 살짝 끼워 넣습니다. 이 판은 절대 풀로 붙이지 마세요. 붙이면 돌아가지 않아요!</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <circle cx="50" cy="30" r="24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" />
                    <circle cx="50" cy="30" r="15" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1.5" />
                    <path d="M35 30 A15 15 0 0 1 65 30" fill="none" stroke="var(--primary-main)" strokeWidth="1.5" markerEnd="url(#none)" />
                    <path d="M63 26 L66 30 L60 31 Z" fill="var(--primary-main)" />
                    <text x="50" y="55" fontSize="8" textAnchor="middle" fill="red">풀칠 금지!</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">4</div>
              <div className="step-content">
                <h4>덮개 덮고 돌려보기</h4>
                <p>덮개를 맨 위에 덮어 테두리만 붙이세요. 손잡이 홈으로 돌림판 가장자리를 밀면 창문 속 그림이 바뀝니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <circle cx="50" cy="30" r="24" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M50 30 L42 10 A24 24 0 0 1 58 10 Z" fill="gold" stroke="orange" strokeWidth="1" />
                    <path d="M40 52 A24 24 0 0 0 60 52 L56 45 A17 17 0 0 1 44 45 Z" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M30 45 Q24 40 30 35" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeDasharray="2 2" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        );

      case 'flip-disc':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>고정 반쪽 + 넘김판 오리기</h4>
                <p>왼쪽 고정 반쪽 1개와 오른쪽 넘김판 여러 장을 실선대로 오려주세요. 넘김판 왼쪽에 붙은 네모(풀칠 자리)는 자르지 말고 남겨둡니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 120 60" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    {/* fixed left half */}
                    <path d="M30 8 A22 22 0 0 0 30 52 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <text x="20" y="33" fontSize="6" textAnchor="middle" fill="var(--text-secondary)">고정</text>
                    {/* one flip page: tab + right half + nub */}
                    <rect x="72" y="8" width="6" height="44" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <path d="M78 8 A22 22 0 0 1 78 52" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M78 8 L78 52" stroke="blue" strokeWidth="1" strokeDasharray="3 1 1 1" />
                    <path d="M99 42 l4 2 l-2 3 z" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>경첩 접었다 펴기</h4>
                <p>넘김판마다 왼쪽 네모(경첩)를 파란 점선을 따라 뒤로 접었다 폈다 해서 부드러운 접힘 자국을 내주세요. 여기가 책장처럼 넘어가는 부분이에요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="110" viewBox="0 0 100 55" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <path d="M40 8 A20 20 0 0 1 40 48" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M40 8 L28 12 L28 44 L40 48" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M40 8 L40 48" stroke="blue" strokeWidth="1.5" strokeDasharray="3 1 1 1" />
                    <path d="M52 16 q10 12 0 24" fill="none" stroke="var(--primary-main)" strokeWidth="1.5" strokeDasharray="2 2" />
                    <path d="M52 40 l-2 -4 l4 0 z" fill="var(--primary-main)" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>네모(경첩)끼리만 풀칠! 반원은 붙이지 마세요</h4>
                <p>넘김판을 ①②③ 순서대로 포개고, 왼쪽 네모끼리만 풀칠해 한 묶음으로 붙입니다. 반원 그림 부분은 절대 서로 붙이면 안 돼요. 붙이면 넘겨지지 않아요!</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 110 60" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    {/* stacked half discs, fanned */}
                    <path d="M46 12 A20 20 0 0 1 46 52" fill="none" stroke="var(--text-secondary)" strokeWidth="1.2" />
                    <path d="M44 10 A20 20 0 0 1 44 50" fill="none" stroke="var(--text-secondary)" strokeWidth="1.2" />
                    <path d="M42 8 A20 20 0 0 1 42 48" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    {/* glued tab column */}
                    <rect x="30" y="8" width="12" height="44" fill="rgba(0,170,0,0.2)" stroke="green" strokeWidth="1.2" />
                    <text x="36" y="33" fontSize="5" textAnchor="middle" fill="green">풀칠</text>
                    {/* forbidden marker on the disc faces */}
                    <text x="60" y="27" fontSize="8" textAnchor="middle" fill="red">✕</text>
                    <text x="60" y="42" fontSize="5.5" textAnchor="middle" fill="red">반원 붙이기 금지</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">4</div>
              <div className="step-content">
                <h4>밑판에 붙이고 넘겨보기</h4>
                <p>묶은 넘김판의 맨 아래 네모를 밑판 가운데 세로선에 붙여 반원이 오른쪽으로 펼쳐지게 하고, 그 위에 왼쪽 고정 반쪽을 덮어 붙입니다. 오른쪽 반원을 한 장씩 왼쪽으로 넘기면 요리가 짠! 하고 바뀝니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 110 60" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    {/* full assembled circle */}
                    <circle cx="55" cy="30" r="22" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M55 8 L55 52" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="2 2" />
                    {/* one page lifting */}
                    <path d="M55 8 A22 22 0 0 1 74 44" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1.5" opacity="0.85" transform="rotate(-24 55 30)" />
                    <path d="M40 14 q-8 8 0 16" fill="none" stroke="var(--text-secondary)" strokeWidth="1.2" strokeDasharray="2 2" />
                    <path d="M40 30 l-2 -4 l4 0 z" fill="var(--text-secondary)" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        );

      case 'spiral-spring':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>소용돌이 오리기</h4>
                <p>동그란 판을 오리고, 안쪽 소용돌이(스파이럴) 선도 끝까지 오려주세요. 다 오리면 돌돌 말린 종이 스프링이 됩니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <circle cx="35" cy="30" r="24" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
                    <path d="M35 30 m0 -4 a4 4 0 1 1 -0.1 0 M35 12 a18 18 0 1 1 -0.1 0 M35 6 a24 24 0 0 1 22 22"
                          fill="none" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <path d="M75 50 L90 35 M90 50 L75 35" stroke="var(--primary-main)" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>가운데(①)와 바깥 끝(②)만 붙이기</h4>
                <p>가운데 원(①)은 아래 종이면에, 소용돌이 바깥쪽 끝(②)만 위 종이면의 ‘②붙이기’ 자리에 붙이세요. 이 두 곳만 붙이고, 돌돌 말린 띠의 나머지는 절대 어디에도 붙이지 마세요! 붙으면 늘어나지 않아요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <path d="M15 45 L50 55 L85 45" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <circle cx="50" cy="50" r="3" fill="green" />
                    <text x="50" y="59" fontSize="6" textAnchor="middle" fill="green">① 가운데</text>
                    <circle cx="50" cy="18" r="3" fill="green" />
                    <text x="50" y="12" fontSize="6" textAnchor="middle" fill="green">② 바깥 끝</text>
                    <path d="M50 47 Q60 32 50 21" fill="none" stroke="var(--text-secondary)" strokeWidth="1.2" strokeDasharray="2 2" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>번호 자리에만, 표시된 크기 안에서 장식 붙이기</h4>
                <p>①②③④ 번호가 찍힌 자리에만 행성·인형 같은 장식을 붙이세요. 옆에 적힌 ‘최대 반지름’보다 큰 장식은 붙이지 마세요. 그보다 크면 카드를 열 때 장식이 종이 밖으로 삐져나옵니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <circle cx="40" cy="30" r="10" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1.5" />
                    <circle cx="40" cy="30" r="1.8" fill="var(--text-primary)" />
                    <text x="40" y="45" fontSize="6" textAnchor="middle" fill="var(--text-secondary)">최대 크기 OK</text>
                    <circle cx="78" cy="30" r="17" fill="none" stroke="red" strokeWidth="1.5" strokeDasharray="3 2" />
                    <path d="M70 22 L86 38 M86 22 L70 38" stroke="red" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">4</div>
              <div className="step-content">
                <h4>열면 둥실 떠오르기</h4>
                <p>카드를 닫으면 스프링이 납작하게 돌돌 말리고, 열면 소용돌이가 위로 쭉 늘어나며 장식들이 서로 다른 높이로 떠오릅니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="150" viewBox="0 0 100 75" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <path d="M20 65 L50 72 L80 55 L50 10 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <path d="M50 68 C30 58 70 50 45 42 C25 36 65 30 44 22" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
                    <circle cx="47" cy="55" r="6" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1" />
                    <circle cx="52" cy="40" r="7" fill="gold" stroke="orange" strokeWidth="1" />
                    <circle cx="46" cy="24" r="6" fill="#7ec8e3" stroke="var(--primary-main)" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        );

      case 'rising-slide':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>슬롯·슬라이더·멈춤 띠 오리기</h4>
                <p>앞면의 세로 슬롯(길쭉한 구멍), 긴 슬라이더 조각, 멈춤 띠 2개, 작은 그림을 실선대로 오려주세요. 빛줄기·하늘 배경은 인쇄된 그림이라 오리지 않습니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 120 60" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    {/* card with vertical slot */}
                    <rect x="14" y="8" width="34" height="44" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <rect x="29" y="14" width="4" height="32" fill="var(--bg-app)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    {/* long slider strip with flange bumps */}
                    <rect x="66" y="8" width="10" height="44" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <rect x="62" y="40" width="4" height="5" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <rect x="76" y="40" width="4" height="5" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <text x="71" y="6" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">손잡이</text>
                    {/* two retainer strips */}
                    <rect x="90" y="16" width="24" height="6" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <rect x="90" y="30" width="24" height="6" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <text x="102" y="46" fontSize="4.5" textAnchor="middle" fill="green">멈춤 띠 2개</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>그림 탭을 슬롯에 끼우고 그림 붙이기</h4>
                <p>슬라이더를 카드 뒤에 대고, 맨 아래 탭을 빨간 점선(산접기)으로 앞으로 접어 슬롯을 통과시킨 뒤, 앞으로 나온 탭에 작은 그림을 붙입니다. 그림과 슬라이더가 슬롯보다 넓어 카드를 앞뒤로 꽉 물어요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* side cross-section: card slice with slot, slider behind, tab through, figure front */}
                    <rect x="46" y="8" width="4" height="44" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <rect x="50" y="20" width="4" height="20" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <path d="M50 28 L46 28 L42 30 L42 34 L46 32 Z" fill="var(--primary-main)" stroke="var(--text-primary)" strokeWidth="1" />
                    <path d="M40 32 l-4 2 l4 2 z" fill="gold" stroke="orange" strokeWidth="0.8" />
                    <text x="30" y="30" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">그림(앞)</text>
                    <text x="70" y="30" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">슬라이더(뒤)</text>
                    <path d="M52 46 l0 5 M50 49 l2 2 l2 -2" stroke="red" strokeWidth="1" fill="none" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>⚠️ 안전 걸림: 위 멈춤 띠 붙이기 (양 끝만!)</h4>
                <p>슬롯 바로 위 뒷면에 <b>① 위 멈춤 띠</b>를 다리처럼 얹고 <b>양 끝 초록색만</b> 붙입니다. 가운데는 붙이지 마세요 — 슬라이더가 그 아래로 지나가요. 슬라이더 옆의 넓은 <b>멈춤 날개</b>가 이 띠보다 넓어서, 손잡이를 세게 당겨도 위로 <b>쏙 빠지지 않습니다</b>. 아래 ② 안내 띠도 같은 방법으로 붙여 슬라이더가 똑바로 움직이게 합니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="130" viewBox="0 0 100 65" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* slider strip going up through a bridge; wide flange catching under it */}
                    <rect x="45" y="6" width="10" height="52" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.3" />
                    {/* retainer bridge: glued ends, open middle */}
                    <rect x="30" y="18" width="10" height="7" fill="rgba(0,170,0,0.25)" stroke="green" strokeWidth="1.2" />
                    <rect x="60" y="18" width="10" height="7" fill="rgba(0,170,0,0.25)" stroke="green" strokeWidth="1.2" />
                    <path d="M40 18 L60 18 M40 25 L60 25" stroke="green" strokeWidth="1" strokeDasharray="2 2" />
                    <text x="50" y="15" fontSize="4" textAnchor="middle" fill="green">가운데 붙이지 않음</text>
                    {/* wide flange sitting just below the bridge */}
                    <rect x="39" y="27" width="22" height="6" fill="var(--primary-main)" stroke="var(--text-primary)" strokeWidth="1.3" />
                    <text x="78" y="31" fontSize="4.5" textAnchor="middle" fill="var(--primary-main)">멈춤 날개</text>
                    {/* up arrow + stop */}
                    <path d="M50 44 l0 -8 M47 39 l3 -3 l3 3" stroke="red" strokeWidth="1.3" fill="none" />
                    <text x="50" y="62" fontSize="5" textAnchor="middle" fill="red">당겨도 안 빠짐!</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">4</div>
              <div className="step-content">
                <h4>당기면 위로 스르륵!</h4>
                <p>카드 위로 나온 손잡이를 잡고 위로 당기면 그림이 빛줄기를 따라 올라갑니다. 끝까지 가면 멈춤 날개가 딱 걸려 멈추고, 손을 놓고 살살 내리면 다시 빛 속으로 숨어요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="150" viewBox="0 0 100 75" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <rect x="30" y="10" width="40" height="58" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    {/* beam */}
                    <path d="M44 66 L56 66 L52 20 L48 20 Z" fill="rgba(255,215,0,0.25)" stroke="none" />
                    {/* figure risen near top */}
                    <path d="M50 22 l3 5 l6 0 l-5 4 l2 6 l-6 -4 l-6 4 l2 -6 l-5 -4 l6 0 z" fill="gold" stroke="orange" strokeWidth="0.8" />
                    {/* handle up top + pull arrow */}
                    <rect x="47" y="2" width="6" height="9" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1" />
                    <path d="M50 40 l0 -10 M47 34 l3 -4 l3 4" stroke="red" strokeWidth="1.3" fill="none" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        );

      case 'layered-stage':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>층별 벽 오리기 (양옆 날개는 남기기)</h4>
                <p>각 층(무대) 벽을 실선대로 오려주세요. 벽 세로 양옆의 초록색 날개(풀칠 자리)는 자르지 말고 남깁니다. 벽의 <b>바깥쪽(먼 쪽) 가로선만</b> 오리고, 척추 쪽 가로선은 그대로 두어야 벽이 카드에 붙어 섭니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 120 60" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    {/* nested bands: 3 walls of increasing depth from a spine line */}
                    <path d="M10 52 L110 52" stroke="blue" strokeWidth="1.5" strokeDasharray="4 1 1 1" />
                    <text x="60" y="58" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">척추(가운데 접는 선)</text>
                    <rect x="30" y="38" width="60" height="14" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" strokeDasharray="4 2" />
                    <rect x="38" y="24" width="44" height="14" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" strokeDasharray="4 2" />
                    <rect x="46" y="12" width="28" height="12" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" strokeDasharray="4 2" />
                    <rect x="26" y="40" width="4" height="10" fill="rgba(0,170,0,0.18)" stroke="green" strokeWidth="1" />
                    <rect x="90" y="40" width="4" height="10" fill="rgba(0,170,0,0.18)" stroke="green" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>접어서 벽 세우기 (높이=깊이)</h4>
                <p>빨간 점선(척추 쪽)은 산접기, 파란 점선(바깥 쪽)은 골접기로 접어 벽을 세웁니다. 각 벽은 <b>높이와 깊이가 같아서</b> 카드를 닫으면 자기 칸 안으로 정확히 납작하게 접혀요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 120 60" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    {/* side view: three walls standing at increasing depth */}
                    <path d="M10 50 L110 50" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M35 50 L35 30" stroke="var(--primary-main)" strokeWidth="3" />
                    <path d="M60 50 L60 22" stroke="var(--primary-main)" strokeWidth="3" />
                    <path d="M85 50 L85 14" stroke="var(--primary-main)" strokeWidth="3" />
                    <path d="M33 50 l2 -4 M33 50 l2 4" stroke="red" strokeWidth="1" fill="none" />
                    <text x="60" y="58" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">앞(낮음) → 뒤(높음)</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>⚠️ 맨 뒤 층부터 앞으로 순서대로 붙이기</h4>
                <p>반드시 <b>가장 뒤(깊고 큰 번호) 층부터</b> 붙이세요. 각 층의 양옆 날개를 바깥으로 접어 카드 바닥에 붙입니다. 앞 층을 먼저 붙이면 뒤 층에 손이 닿지 않고, 순서가 틀리면 겹침이 어긋나 <b>카드를 닫을 때 뒤 벽이 밖으로 삐져나와요.</b></p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 120 60" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    <path d="M10 50 L110 50" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <rect x="72" y="14" width="14" height="36" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1.5" />
                    <text x="79" y="10" fontSize="6" textAnchor="middle" fill="red">①먼저</text>
                    <rect x="55" y="24" width="14" height="26" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.3" opacity="0.7" />
                    <text x="62" y="20" fontSize="5.5" textAnchor="middle" fill="var(--text-secondary)">②</text>
                    <rect x="38" y="34" width="14" height="16" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.3" opacity="0.5" />
                    <text x="45" y="30" fontSize="5.5" textAnchor="middle" fill="var(--text-secondary)">③마지막</text>
                    <path d="M90 40 l14 0 M100 36 l4 4 l-4 4" stroke="var(--text-secondary)" strokeWidth="1.2" fill="none" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">4</div>
              <div className="step-content">
                <h4>닫아서 확인하고 열어보기</h4>
                <p>카드를 닫아 <b>모든 층이 카드 바깥 선 안쪽으로 납작하게</b> 접혀 들어가는지 확인하세요. 열면 성벽과 탑이 층층이 서로 다른 깊이로 솟아오릅니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="150" viewBox="0 0 100 75" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <path d="M18 62 L50 74 L82 62 L50 10 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <rect x="40" y="30" width="20" height="30" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1" />
                    <rect x="34" y="40" width="32" height="22" fill="rgba(0,0,0,0.05)" stroke="var(--text-primary)" strokeWidth="1" />
                    <rect x="46" y="20" width="8" height="18" fill="gold" stroke="orange" strokeWidth="1" />
                    <path d="M46 20 l0 -4 M50 20 l0 -6 M54 20 l0 -4" stroke="orange" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        );

      case 'generic':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>오리기</h4>
                <p>검은색 실선을 따라 팝업 조각들을 모두 오려주세요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <rect x="20" y="10" width="60" height="40" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeDasharray="4 2" />
                    <path d="M10 50 L30 30 M30 50 L10 30" stroke="var(--primary-main)" strokeWidth="2" /> {/* Scissors icon hint */}
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>접기</h4>
                <p>빨간 점선은 산접기(볼록하게), 파란 점선은 골접기(오목하게) 해줍니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                  <svg width="120" height="80" viewBox="0 0 60 40" style={{ width: '45%', maxWidth: '150px', height: 'auto' }}>
                    <path d="M10 30 L30 10 L50 30" fill="none" stroke="red" strokeWidth="2" strokeDasharray="5 5" />
                    <text x="30" y="38" fontSize="10" textAnchor="middle" fill="var(--text-primary)">산접기(Mountain)</text>
                  </svg>
                  <svg width="120" height="80" viewBox="0 0 60 40" style={{ width: '45%', maxWidth: '150px', height: 'auto' }}>
                    <path d="M10 10 L30 30 L50 10" fill="none" stroke="blue" strokeWidth="2" strokeDasharray="5 5" />
                    <text x="30" y="38" fontSize="10" textAnchor="middle" fill="var(--text-primary)">골접기(Valley)</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>풀칠하여 조립하기</h4>
                <p>안내된 풀칠 기호에 맞춰 배경 카드에 팝업 조각을 붙여주세요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="160" viewBox="0 0 100 80" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* Isometric card open */}
                    <path d="M20 60 L50 75 L80 60 L50 10 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <path d="M20 60 L50 75 L50 45 L20 30 Z" fill="rgba(0,0,0,0.05)" stroke="var(--text-primary)" strokeWidth="1" />
                    {/* Pop-up mechanism abstract */}
                    <path d="M40 50 L60 60 L60 30 L40 20 Z" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        );

      default:
        return <p>설명서가 준비되지 않은 메커니즘입니다.</p>;
    }
  };

  return (
    <div className="preview-content" style={{ overflowY: 'auto', padding: 'var(--space-xl)' }}>
      <h3 style={{ marginBottom: 'var(--space-lg)' }}>{cardParams.theme} - 조립 설명서</h3>
      <div className="instructions-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {renderSteps()}
      </div>
    </div>
  );
}
