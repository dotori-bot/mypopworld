import React from 'react';
import useCardStore from '../../store/useCardStore';
import { getMechanism } from '../../generators/registry';
import { getElements } from '../../store/cardModel';
import { CIRCLED_NUMBERS } from '../../generators/assemblyMap';
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

  const elements = getElements(cardParams);

  const renderSteps = (element) => {
    const instructionStyle = getMechanism(element.mechanism)?.instructionStyle;

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

      case 'camera-print-pull':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>카메라 카드·슬롯·띠·롤러 오리기</h4>
                <p>카메라 모양 앞면 카드, 사진이 나오는 세로 슬롯, 손잡이가 나오는 아래쪽 슬롯, 되돌림 띠, 롤러(튜브) 조각, 멈춤/안내 띠를 실선대로 오려주세요. 카메라·렌즈 그림은 인쇄된 안내선이라 오리지 않습니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="130" viewBox="0 0 120 65" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    {/* camera card with vertical photo slot + horizontal tab slot */}
                    <rect x="10" y="6" width="36" height="52" rx="4" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" strokeDasharray="4 2" />
                    <circle cx="28" cy="36" r="9" fill="none" stroke="var(--text-primary)" strokeWidth="1" strokeDasharray="4 2" />
                    <rect x="25" y="12" width="4" height="16" fill="var(--bg-app)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <rect x="16" y="50" width="24" height="4" fill="var(--bg-app)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    {/* reversing strip */}
                    <rect x="58" y="10" width="40" height="9" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <text x="78" y="8" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">되돌림 띠</text>
                    {/* roller tube (rolled) */}
                    <ellipse cx="66" cy="34" rx="4" ry="9" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <rect x="66" y="25" width="26" height="18" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <ellipse cx="92" cy="34" rx="4" ry="9" fill="none" stroke="var(--text-primary)" strokeWidth="1" />
                    <text x="79" y="49" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">① 롤러</text>
                    {/* retainer strip */}
                    <rect x="60" y="54" width="30" height="6" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <text x="75" y="63" fontSize="4.5" textAnchor="middle" fill="green">② 멈춤/안내 띠</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>⚠️ 롤러 말아서 양 끝만 붙이기</h4>
                <p>가장 긴 네모(<b>① 롤러</b>)를 둥글게 말아 튜브로 만든 뒤, 카드 맨 위 뒷면에 다리처럼 얹고 <b>양 끝 초록색만</b> 붙이세요. 가운데는 절대 붙이지 마세요 — 가운데가 붕 뜬 채로 남아야 되돌림 띠가 그 위로 180도 넘어갈 수 있어요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* Isometric rolled tube, same convention as the straw-rocket tube */}
                    <ellipse cx="50" cy="15" rx="16" ry="5" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <path d="M34 15 L34 30 A16 5 0 0 0 66 30 L66 15 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <ellipse cx="50" cy="30" rx="16" ry="5" fill="none" stroke="var(--text-primary)" strokeWidth="1" />
                    {/* glue ends only, centre arches free */}
                    <rect x="30" y="38" width="10" height="6" fill="rgba(0,170,0,0.25)" stroke="green" strokeWidth="1" />
                    <rect x="60" y="38" width="10" height="6" fill="rgba(0,170,0,0.25)" stroke="green" strokeWidth="1" />
                    <path d="M40 41 L60 41" stroke="green" strokeWidth="1" strokeDasharray="2 2" />
                    <text x="50" y="53" fontSize="4.5" textAnchor="middle" fill="green">양 끝만 붙이기 (가운데 X)</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>띠 걸고 사진·멈춤 띠 붙이기</h4>
                <p>되돌림 띠를 롤러 위에 걸쳐주세요. 한쪽 끝(마운트)에 <b>사진</b>을 붙이고, 반대쪽 끝(손잡이)은 아래쪽 슬롯을 통해 앞면으로 빼냅니다. 사진 슬롯 바로 위 뒷면에는 <b>② 멈춤/안내 띠</b>를 양 끝만 붙이세요. 중요: 되돌림 띠는 사진 쪽 끝과 손잡이 쪽 끝, 이 두 곳 말고는 어디에도 붙이지 마세요!</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="140" viewBox="0 0 100 70" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* roller at top, strip wraps down both sides */}
                    <rect x="35" y="4" width="30" height="8" rx="4" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <text x="50" y="2" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">① 롤러</text>
                    <path d="M40 12 L40 40" stroke="var(--primary-main)" strokeWidth="3" />
                    <path d="M60 12 L60 30" stroke="var(--primary-main)" strokeWidth="3" />
                    {/* photo at mount end */}
                    <rect x="50" y="30" width="20" height="24" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <path d="M50 48 L70 48" stroke="var(--text-secondary)" strokeWidth="1" />
                    <text x="60" y="60" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">사진</text>
                    {/* retainer above photo */}
                    <rect x="48" y="26" width="24" height="4" fill="rgba(0,170,0,0.2)" stroke="green" strokeWidth="1" />
                    <text x="20" y="28" fontSize="4.2" textAnchor="middle" fill="green">② 멈춤 띠</text>
                    {/* handle tab at bottom */}
                    <rect x="35" y="40" width="10" height="18" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <text x="40" y="65" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">PULL 손잡이</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">4</div>
              <div className="step-content">
                <h4>아래로 당기면 사진이 위로!</h4>
                <p>카드 아래로 나온 "PULL ↓" 손잡이를 잡고 아래로 당기면, 띠가 롤러를 넘어가면서 사진이 위쪽 슬롯 밖으로 쑤욱 올라옵니다. 끝까지 당기면 멈춤 띠에 걸려 멈추고, 사진을 살살 눌러 내리면(손잡이가 도로 위로 올라가며) 다시 처음 모습으로 돌아갑니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="150" viewBox="0 0 100 75" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <rect x="28" y="8" width="44" height="60" rx="4" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    {/* photo risen near the top slot */}
                    <rect x="38" y="12" width="24" height="20" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1.2" />
                    <path d="M50 26 l0 -10 M46 20 l4 -4 l4 4" stroke="red" strokeWidth="1.3" fill="none" />
                    {/* pull tab hanging well below the card, pulled down */}
                    <rect x="46" y="68" width="8" height="16" fill="var(--primary-main)" stroke="var(--text-primary)" strokeWidth="1" />
                    <path d="M50 68 l0 10 M47 74 l3 4 l3 -4" stroke="red" strokeWidth="1.3" fill="none" />
                    <text x="50" y="94" fontSize="5" textAnchor="middle" fill="red">아래로 당기면 사진이 위로!</text>
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
              <div className="step-badge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tent size={16} />
              </div>
              <div className="step-content">
                <h4>완성하면 이런 모습이에요!</h4>
                <p>케이크처럼 생긴 층(보통 3층)이 <b>카드 양면 사이에 다리처럼 걸쳐</b> 붙어 있어요. 그래서 카드를 <b>여닫는 동작만으로</b> 층들이 저절로 솟아오르고, 닫으면 납작해져요. <b>90도쯤 열었을 때</b> 가장 반듯한 상자 모양이 됩니다. 1층이 맨 아래(제일 큼), 위로 갈수록 작아져요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="220" height="150" viewBox="0 0 150 100" style={{ width: '100%', maxWidth: '340px', height: 'auto' }}>
                    {/* Side view (cross-section) of the card opened to 90°:
                        floor page horizontal, backdrop page vertical, three
                        nested tier boxes stepping up against the corner. */}
                    <path d="M30 90 L140 90" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M30 90 L30 6" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <text x="120" y="97" fontSize="5" textAnchor="middle" fill="var(--text-secondary)">바닥 면</text>
                    <text x="22" y="16" fontSize="5" textAnchor="middle" fill="var(--text-secondary)" transform="rotate(-90 22 16)">뒷벽 면</text>
                    <circle cx="30" cy="90" r="2" fill="var(--text-secondary)" />
                    <text x="38" y="97" fontSize="4.5" fill="var(--text-secondary)">척추</text>
                    {/* Tier 1 (bottom, biggest): front at x=82, top at y=54 */}
                    <path d="M82 90 L82 54 L30 54" fill="none" stroke="var(--primary-main)" strokeWidth="2.5" />
                    <circle cx="88" cy="72" r="6" fill="var(--primary-main)" />
                    <text x="88" y="74.5" fontSize="6" textAnchor="middle" fill="#fff">1</text>
                    {/* Tier 2 standing on tier 1's top panel */}
                    <path d="M66 54 L66 28 L30 28" fill="none" stroke="var(--text-primary)" strokeWidth="2.5" />
                    <circle cx="73" cy="41" r="6" fill="var(--text-primary)" />
                    <text x="73" y="43.5" fontSize="6" textAnchor="middle" fill="#fff">2</text>
                    {/* Tier 3 (top, smallest) */}
                    <path d="M50 28 L50 10 L30 10" fill="none" stroke="orange" strokeWidth="2.5" />
                    <circle cx="57" cy="19" r="6" fill="orange" />
                    <text x="57" y="21.5" fontSize="6" textAnchor="middle" fill="#fff">3</text>
                    {/* opening-drive arrows */}
                    <path d="M120 66 A 42 42 0 0 1 96 30" fill="none" stroke="red" strokeWidth="1" strokeDasharray="3 2" />
                    <path d="M96 30 l6 0 l-3 6 z" fill="red" />
                    <text x="122" y="46" fontSize="4.5" fill="red">여닫으면 저절로!</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>층 조각(띠) 오리기</h4>
                <p>검은색 실선을 따라 층 조각(긴 띠)을 모두 오려주세요. 띠 하나는 위에서부터 <b>[뒤 날개(초록) → 윗면 → 앞면 → 아래 날개(초록)]</b> 순서예요. 초록색 날개는 자르지 말고 띠에 붙여 둡니다. (카드에 구멍 나는 게 싫으면 띠를 색지에 대고 그려 오려도 좋아요.)</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="130" viewBox="0 0 120 66" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    <rect x="25" y="4" width="70" height="58" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <rect x="25" y="4" width="70" height="8" fill="rgba(0,170,0,0.18)" stroke="green" strokeWidth="0.8" />
                    <text x="60" y="10" fontSize="4.5" textAnchor="middle" fill="green">뒤 날개 (풀칠)</text>
                    <path d="M25 12 L95 12" stroke="blue" strokeWidth="1.2" strokeDasharray="3 2" />
                    <text x="60" y="22" fontSize="5" textAnchor="middle" fill="var(--text-secondary)">윗면</text>
                    <path d="M25 30 L95 30" stroke="red" strokeWidth="1.2" strokeDasharray="4 1 1 1" />
                    <text x="60" y="43" fontSize="5" textAnchor="middle" fill="var(--text-secondary)">앞면 (그림 붙는 곳)</text>
                    <path d="M25 54 L95 54" stroke="blue" strokeWidth="1.2" strokeDasharray="3 2" />
                    <rect x="25" y="54" width="70" height="8" fill="rgba(0,170,0,0.18)" stroke="green" strokeWidth="0.8" />
                    <text x="60" y="60" fontSize="4.5" textAnchor="middle" fill="green">아래 날개 (풀칠)</text>
                    <text x="108" y="13.5" fontSize="4" fill="blue">골접기</text>
                    <text x="108" y="31.5" fontSize="4" fill="red">산접기</text>
                    <text x="108" y="55.5" fontSize="4" fill="blue">골접기</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>ㄱ자로 접기</h4>
                <p>초록 날개 두 곳의 파란 점선은 <b>골접기</b>(뒤로, 오목하게), 가운데 빨간 점선(윗면과 앞면 사이)은 <b>산접기</b>(앞으로, 볼록하게) 하세요. 접고 나면 띠가 <b>ㄱ자 상자 모양</b>이 됩니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="100" viewBox="0 0 120 50" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* folded strip, side view: flap / top / front / flap */}
                    <path d="M20 14 L20 6" stroke="green" strokeWidth="2.5" />
                    <path d="M20 14 L78 14" stroke="var(--primary-main)" strokeWidth="2.5" />
                    <path d="M78 14 L78 44" stroke="var(--primary-main)" strokeWidth="2.5" />
                    <path d="M78 44 L64 44" stroke="green" strokeWidth="2.5" />
                    <text x="14" y="11" fontSize="4.5" fill="green">뒤 날개</text>
                    <text x="49" y="10" fontSize="5" textAnchor="middle" fill="var(--text-secondary)">윗면</text>
                    <text x="86" y="30" fontSize="5" fill="var(--text-secondary)">앞면</text>
                    <text x="63" y="49.5" fontSize="4.5" fill="green">아래 날개(안쪽으로)</text>
                    <circle cx="78" cy="14" r="2.4" fill="none" stroke="red" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>⚠️ 조립 순서: 반드시 아래층(1층)부터 위로!</h4>
                <p><b>1층(제일 큰 띠)을 가장 먼저</b> 붙이고, 그 위에 2층, 3층 순서로 쌓으세요. 위층의 아래 날개는 <b>바로 아래층의 윗면에</b> 붙기 때문에, 아래층이 먼저 서 있어야 다음 층을 붙일 수 있어요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="220" height="90" viewBox="0 0 140 46" style={{ width: '100%', maxWidth: '340px', height: 'auto' }}>
                    <circle cx="20" cy="23" r="14" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1.5" />
                    <text x="20" y="28" fontSize="13" textAnchor="middle" fill="var(--text-primary)">1</text>
                    <path d="M38 23 L58 23 M52 17 l6 6 l-6 6" stroke="var(--text-primary)" strokeWidth="2" fill="none" />
                    <circle cx="70" cy="23" r="12" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <text x="70" y="28" fontSize="12" textAnchor="middle" fill="var(--text-primary)">2</text>
                    <path d="M86 23 L104 23 M98 18 l6 5 l-6 5" stroke="var(--text-primary)" strokeWidth="2" fill="none" />
                    <circle cx="118" cy="23" r="10" fill="gold" stroke="orange" strokeWidth="1.5" />
                    <text x="118" y="27" fontSize="10" textAnchor="middle" fill="var(--text-primary)">3</text>
                    <text x="20" y="43" fontSize="5.5" textAnchor="middle" fill="var(--text-secondary)">①먼저(맨 아래·큼)</text>
                    <text x="118" y="43" fontSize="5.5" textAnchor="middle" fill="var(--text-secondary)">마지막(맨 위·작음)</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">4</div>
              <div className="step-content">
                <h4>날개를 풀칠선에 맞춰 붙이기</h4>
                <p>카드를 90도쯤 세워 두고 붙이면 쉬워요. <b>1층</b>: 아래 날개를 바닥 면의 <b>㉠ 선</b>에(날개는 척추 쪽으로), 뒤 날개를 뒷벽 면의 <b>① 선</b>에(날개는 위쪽으로) 붙이세요. <b>2층부터</b>: 아래 날개를 <b>아래층 윗면에 인쇄된 ㉡ 선</b>에(날개는 뒷벽 쪽으로), 뒤 날개를 뒷벽 면의 <b>같은 번호(②, ③…) 선</b>에 붙이세요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="220" height="140" viewBox="0 0 150 94" style={{ width: '100%', maxWidth: '340px', height: 'auto' }}>
                    <path d="M30 84 L140 84" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M30 84 L30 6" stroke="var(--text-primary)" strokeWidth="1.5" />
                    {/* tier 1 attached: bottom flap inward at ㉠, rear flap up at ① */}
                    <path d="M82 84 L82 50 L30 50" fill="none" stroke="var(--primary-main)" strokeWidth="2.5" />
                    <path d="M82 84 L70 84" stroke="green" strokeWidth="3" />
                    <text x="76" y="91" fontSize="5" textAnchor="middle" fill="green">㉠</text>
                    <path d="M30 50 L30 40" stroke="green" strokeWidth="3" />
                    <text x="24" y="44" fontSize="5" textAnchor="middle" fill="green">①</text>
                    {/* tier 2's bottom flap landing on tier 1's top panel at ㉡ */}
                    <path d="M64 50 L64 26 L30 26" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeDasharray="4 2" />
                    <path d="M64 50 L54 50" stroke="green" strokeWidth="3" />
                    <text x="58" y="57" fontSize="5" textAnchor="middle" fill="green">㉡</text>
                    <path d="M30 26 L30 17" stroke="green" strokeWidth="3" />
                    <text x="24" y="21" fontSize="5" textAnchor="middle" fill="green">②</text>
                    <text x="106" y="40" fontSize="4.5" fill="var(--text-secondary)">2층은 1층 윗면 위에!</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">5</div>
              <div className="step-content">
                <h4>장식 그림 붙이기 — 층마다 한 장씩 나와요!</h4>
                <p>이 도안은 층마다 어울리는 그림이 필요해서, 2번째 페이지부터 <b>층 개수만큼 장식 그림이 따로따로</b> 나옵니다. 각 장식 페이지에 적힌 번호(예: "1층 앞면 그림", "2층 앞면 그림"…)를 확인해서, 가위로 오린 뒤 <b>같은 번호 층의 앞면</b>에 풀칠해 붙이세요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="100" viewBox="0 0 120 50" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    <rect x="8" y="8" width="26" height="34" rx="2" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <text x="21" y="27" fontSize="8" textAnchor="middle" fill="var(--text-secondary)">1</text>
                    <rect x="42" y="8" width="26" height="34" rx="2" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <text x="55" y="27" fontSize="8" textAnchor="middle" fill="var(--text-secondary)">2</text>
                    <rect x="76" y="8" width="26" height="34" rx="2" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <text x="89" y="27" fontSize="8" textAnchor="middle" fill="var(--text-secondary)">3</text>
                    <text x="21" y="4" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">1층 앞면 그림</text>
                    <text x="55" y="4" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">2층 앞면 그림</text>
                    <text x="89" y="4" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">3층 앞면 그림</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">6</div>
              <div className="step-content">
                <h4>천천히 여닫아 확인하기</h4>
                <p>카드를 천천히 닫아 <b>모든 층이 카드 안쪽으로 납작하게</b> 접혀 들어가는지 확인하세요. 신기하게도 <b>활짝(180도) 펼쳐도 납작해지고</b>, 90도쯤 열었을 때 케이크가 가장 반듯하게 우뚝 섭니다. 걸리는 층이 있으면 그 층 날개를 떼어 풀칠선에 다시 맞춰 붙여 주세요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="220" height="110" viewBox="0 0 150 60" style={{ width: '100%', maxWidth: '340px', height: 'auto' }}>
                    {/* closed → 90° → flat sequence */}
                    <path d="M10 46 L34 46 M10 46 L10 44 L34 44" stroke="var(--text-primary)" strokeWidth="1.5" fill="none" />
                    <text x="22" y="55" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">닫으면 납작</text>
                    <path d="M42 30 l8 0 M46 26 l4 4 l-4 4" stroke="var(--text-secondary)" strokeWidth="1" fill="none" />
                    <path d="M60 46 L88 46 M60 46 L60 18" stroke="var(--text-primary)" strokeWidth="1.5" fill="none" />
                    <path d="M78 46 L78 34 L60 34 M72 34 L72 26 L60 26" stroke="var(--primary-main)" strokeWidth="1.6" fill="none" />
                    <text x="74" y="55" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">90°에서 우뚝!</text>
                    <path d="M96 30 l8 0 M100 26 l4 4 l-4 4" stroke="var(--text-secondary)" strokeWidth="1" fill="none" />
                    <path d="M112 46 L144 46" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M116 44 L140 44" stroke="var(--primary-main)" strokeWidth="1.2" />
                    <text x="128" y="55" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">180°도 납작</text>
                  </svg>
                </div>
              </div>
            </div>
          </>
        );

      case 'auto-slide-window':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>부품 4종 오리기</h4>
                <p>창문 액자(가운데 창 구멍도), 긴 메시지 띠(슬라이더), 지지대(팔) 1개, 안내다리 2개를 실선대로 오려주세요. 아래쪽 고정 뒷면은 붙이는 위치 안내만 있으니 오리지 않습니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 120 60" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    {/* message strip with two message blocks + drive tab */}
                    <rect x="12" y="8" width="16" height="44" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.3" />
                    <rect x="14" y="16" width="12" height="8" fill="none" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="2 1" />
                    <rect x="14" y="34" width="12" height="8" fill="none" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="2 1" />
                    <rect x="28" y="26" width="8" height="8" fill="rgba(0,170,0,0.18)" stroke="green" strokeWidth="1" />
                    <text x="20" y="6" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">메시지 띠</text>
                    {/* frame with cut window */}
                    <rect x="52" y="14" width="30" height="24" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.3" />
                    <rect x="60" y="20" width="14" height="12" fill="var(--bg-app)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <text x="67" y="12" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">창문 액자</text>
                    {/* strut */}
                    <rect x="92" y="10" width="8" height="34" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.3" />
                    <rect x="92" y="10" width="8" height="5" fill="rgba(0,170,0,0.18)" stroke="green" strokeWidth="0.8" />
                    <rect x="92" y="39" width="8" height="5" fill="rgba(0,170,0,0.18)" stroke="green" strokeWidth="0.8" />
                    <text x="96" y="8" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">지지대</text>
                    {/* one guide bridge */}
                    <rect x="104" y="24" width="14" height="6" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <text x="111" y="38" fontSize="4" textAnchor="middle" fill="green">안내다리</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>메시지 띠 얹고 안내다리 붙이기 (양 끝만!)</h4>
                <p>메시지 띠를 뒷면 안내 위치에 올리고, 안내다리 <b>Ⓐ·Ⓑ</b>를 다리처럼 얹어 <b>양 끝 초록색만</b> 붙이세요. 가운데는 붙이지 마세요 — 띠가 그 아래로 지나갑니다. 띠 양 끝의 넓은 <b>멈춤 날개</b>가 걸려 빠지지 않아요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <rect x="42" y="6" width="16" height="48" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.3" />
                    <rect x="38" y="8" width="24" height="4" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1" />
                    <rect x="38" y="48" width="24" height="4" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1" />
                    <rect x="30" y="18" width="10" height="6" fill="rgba(0,170,0,0.25)" stroke="green" strokeWidth="1.1" />
                    <rect x="60" y="18" width="10" height="6" fill="rgba(0,170,0,0.25)" stroke="green" strokeWidth="1.1" />
                    <path d="M40 18 L60 18 M40 24 L60 24" stroke="green" strokeWidth="0.9" strokeDasharray="2 2" />
                    <text x="50" y="16" fontSize="4" textAnchor="middle" fill="green">가운데 붙이지 않음</text>
                    <text x="80" y="22" fontSize="4.5" textAnchor="middle" fill="var(--primary-main)">멈춤 날개</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>창문 액자 덮기 (좌·우만 풀칠)</h4>
                <p>창 구멍이 메시지 띠 위에 오도록 액자를 덮고, <b>좌·우 초록색 테두리만</b> 붙이세요. 위·아래는 열어두어야 띠가 창문 뒤로 미끄러집니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="110" viewBox="0 0 100 55" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <rect x="30" y="10" width="40" height="34" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.3" />
                    <rect x="40" y="18" width="20" height="18" fill="var(--bg-app)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <rect x="30" y="10" width="6" height="34" fill="rgba(0,170,0,0.25)" stroke="green" strokeWidth="1" />
                    <rect x="64" y="10" width="6" height="34" fill="rgba(0,170,0,0.25)" stroke="green" strokeWidth="1" />
                    <path d="M50 46 l0 6 M47 49 l3 3 l3 -3" stroke="var(--text-secondary)" strokeWidth="1" fill="none" />
                    <text x="50" y="8" fontSize="4.5" textAnchor="middle" fill="green">좌·우만 풀칠</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">4</div>
              <div className="step-content">
                <h4>⚠️ 지지대(팔) 붙이기 — 경첩을 척추와 나란히!</h4>
                <p>지지대 위 끝(①)을 위쪽 여는 앞면의 ‘① 자리’(척추에서 조금 위)에, 아래 끝(②)을 메시지 띠 옆의 <b>드라이브 탭(② 자리)</b>에 붙이세요. 두 접는 선(경첩)이 반드시 <b>척추와 나란히, 같은 세로줄</b>에 와야 합니다. 비뚤면 열 때 걸립니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="130" viewBox="0 0 100 65" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* spine line */}
                    <path d="M10 33 L90 33" stroke="blue" strokeWidth="1.3" strokeDasharray="4 1 1 1" />
                    <text x="20" y="30" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">척추</text>
                    {/* front face pivot (above) and slider tab (below), strut tented */}
                    <circle cx="55" cy="18" r="2.2" fill="var(--primary-main)" />
                    <text x="55" y="12" fontSize="4" textAnchor="middle" fill="var(--primary-main)">① 앞면</text>
                    <circle cx="62" cy="48" r="2.2" fill="green" />
                    <text x="70" y="50" fontSize="4" textAnchor="middle" fill="green">② 띠 탭</text>
                    <path d="M55 18 L62 48" stroke="var(--text-primary)" strokeWidth="2.4" />
                    <text x="42" y="44" fontSize="4.2" textAnchor="middle" fill="var(--text-primary)">지지대</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">5</div>
              <div className="step-content">
                <h4>열면 저절로 짠! 하고 바뀌기</h4>
                <p>카드를 살짝 열면 창문 속 메시지 ①이, 활짝 열면 저절로 메시지 ②로 바뀝니다. 손잡이를 당길 필요 없이 여닫는 것만으로 그림이 지나가요. 닫으면 지지대가 납작하게 접혀 책처럼 덮입니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 120 60" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    <rect x="14" y="14" width="34" height="30" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <rect x="24" y="22" width="14" height="14" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1" />
                    <text x="31" y="32" fontSize="7" textAnchor="middle" fill="var(--primary-main)">☀</text>
                    <text x="31" y="12" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">살짝 열면 ①</text>
                    <path d="M52 30 l10 0 M58 26 l4 4 l-4 4" stroke="var(--text-secondary)" strokeWidth="1.2" fill="none" />
                    <rect x="72" y="14" width="34" height="30" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <rect x="82" y="22" width="14" height="14" fill="gold" stroke="orange" strokeWidth="1" />
                    <text x="89" y="32" fontSize="7" textAnchor="middle" fill="orange">★</text>
                    <text x="89" y="12" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">활짝 열면 ②</text>
                  </svg>
                </div>
              </div>
            </div>
          </>
        );

      case 'slide-to-swing':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>부품 오리기</h4>
                <p>기둥(팔), 슬라이더(가운데 세로 슬롯도 오려냄), 위·아래 안내띠 2개, 회전축 캡, 장식을 실선대로 오려주세요. 앞면 카드에는 <b>회전축 구멍</b>만 뚫습니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 130 60" style={{ width: '100%', maxWidth: '330px', height: 'auto' }}>
                    {/* post */}
                    <rect x="12" y="10" width="8" height="34" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.3" />
                    <rect x="14.5" y="5" width="3" height="5" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1" />
                    <rect x="13" y="44" width="6" height="8" fill="rgba(0,170,0,0.18)" stroke="green" strokeWidth="1" />
                    <text x="16" y="58" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">기둥</text>
                    {/* slider with vertical slot + handle */}
                    <rect x="34" y="18" width="26" height="18" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.3" />
                    <rect x="45" y="22" width="4" height="10" fill="var(--bg-app)" stroke="var(--text-primary)" strokeWidth="1.1" />
                    <rect x="60" y="22" width="14" height="10" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.1" />
                    <text x="47" y="15" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">슬라이더</text>
                    <text x="67" y="15" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">손잡이</text>
                    {/* guide strips */}
                    <rect x="82" y="16" width="24" height="5" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <rect x="82" y="30" width="24" height="5" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <text x="94" y="44" fontSize="4" textAnchor="middle" fill="green">안내띠 2개</text>
                    {/* cap + heart */}
                    <circle cx="116" cy="16" r="5" fill="none" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <text x="116" y="26" fontSize="3.6" textAnchor="middle" fill="var(--text-secondary)">캡</text>
                    <path d="M116 46 l4 -5 a2.6 2.6 0 0 0 -4 -1 a2.6 2.6 0 0 0 -4 1 z" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1" />
                    <text x="116" y="54" fontSize="3.6" textAnchor="middle" fill="var(--text-secondary)">장식</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>회전축 만들기 (캡은 목에만!)</h4>
                <p>기둥 아래 목을 카드의 회전축 구멍에 끼워 뒤로 빼고, 뒤에서 캡을 <b>목(종이)에만</b> 붙이세요. 카드에는 붙이지 마세요 — 그래야 기둥이 구멍을 중심으로 <b>팽이처럼 자유롭게</b> 좌우로 돕니다. 접는 자국이 아니라 도는 축이라 반복해도 잘 안 찢어져요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* side cross-section: card, post front, neck through hole, cap back */}
                    <rect x="48" y="8" width="4" height="44" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <text x="40" y="8" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">카드</text>
                    <rect x="44" y="14" width="4" height="30" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <text x="36" y="30" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">기둥(앞)</text>
                    <rect x="52" y="27" width="6" height="6" fill="var(--primary-main)" stroke="var(--text-primary)" strokeWidth="1" />
                    <text x="72" y="24" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">캡(뒤)</text>
                    {/* rotation arrow */}
                    <path d="M30 48 a10 10 0 0 1 20 0" fill="none" stroke="var(--primary-main)" strokeWidth="1.3" />
                    <path d="M50 48 l-1 -4 l-3 3 z" fill="var(--primary-main)" />
                    <text x="40" y="58" fontSize="4.5" textAnchor="middle" fill="var(--primary-main)">자유롭게 회전</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>핵심: 핀을 슬롯에 끼우기 (기둥은 돌고, 슬라이더는 곧게)</h4>
                <p>슬라이더를 기둥 위에 겹치고, 기둥 맨 위 <b>핀</b>을 빨간 점선(산접기)으로 앞으로 접어 슬라이더의 <b>세로 슬롯</b>에 통과시키세요. 앞으로 나온 핀에 장식을 붙이면 핀이 앞으로 못 빠지고 슬롯 안에서 <b>위아래로만</b> 움직입니다. 기둥은 원을 그리며 돌지만, 슬롯이 위아래 움직임을 삼켜 슬라이더는 <b>곧게 좌우로만</b> 갑니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="140" viewBox="0 0 100 70" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* pivot at bottom, arc of pin, vertical slot capturing pin */}
                    <circle cx="50" cy="60" r="2.4" fill="var(--text-primary)" />
                    <text x="50" y="68" fontSize="4.2" textAnchor="middle" fill="var(--text-secondary)">회전축</text>
                    {/* arm at three angles */}
                    <path d="M50 60 L34 22" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="2 2" />
                    <path d="M50 60 L50 18" stroke="var(--text-primary)" strokeWidth="1.6" />
                    <path d="M50 60 L66 22" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="2 2" />
                    {/* pin arc */}
                    <path d="M34 22 A 42 42 0 0 1 66 22" fill="none" stroke="var(--primary-main)" strokeWidth="1" strokeDasharray="3 2" />
                    {/* vertical slot on the horizontal slider */}
                    <rect x="30" y="16" width="40" height="14" fill="none" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <rect x="47" y="16" width="6" height="14" fill="var(--bg-app)" stroke="var(--primary-main)" strokeWidth="1.2" />
                    <circle cx="50" cy="20" r="2" fill="var(--primary-main)" />
                    {/* horizontal slide arrows */}
                    <path d="M22 23 l-6 0 M18 20 l-4 3 l4 3" stroke="var(--primary-main)" strokeWidth="1.2" fill="none" />
                    <path d="M78 23 l6 0 M82 20 l4 3 l-4 3" stroke="var(--primary-main)" strokeWidth="1.2" fill="none" />
                    <text x="50" y="9" fontSize="4" textAnchor="middle" fill="var(--primary-main)">슬라이더는 곧게 ↔, 핀은 슬롯 안에서 ↕</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">4</div>
              <div className="step-content">
                <h4>⚠️ 안내띠로 슬라이더 길 만들기 (바깥쪽만 풀칠)</h4>
                <p>슬라이더 위·아래에 안내띠 <b>Ⓐ·Ⓑ</b>를 얹고 <b>바깥쪽 초록색만</b> 카드에 붙여 좌우로만 미끄러지는 길을 만드세요. 슬라이더 양 끝의 넓은 <b>멈춤 날개</b>가 안내띠보다 커서, 세게 밀어도 <b>튀어나가지 않습니다</b>.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <rect x="24" y="24" width="52" height="14" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.2" />
                    <rect x="20" y="22" width="4" height="18" fill="var(--primary-main)" stroke="var(--text-primary)" strokeWidth="1.1" />
                    <rect x="76" y="22" width="4" height="18" fill="var(--primary-main)" stroke="var(--text-primary)" strokeWidth="1.1" />
                    <rect x="30" y="17" width="40" height="5" fill="rgba(0,170,0,0.2)" stroke="green" strokeWidth="1.1" />
                    <rect x="30" y="38" width="40" height="5" fill="rgba(0,170,0,0.2)" stroke="green" strokeWidth="1.1" />
                    <text x="50" y="15" fontSize="4" textAnchor="middle" fill="green">안내띠(바깥쪽만 풀칠)</text>
                    <text x="12" y="52" fontSize="4.2" textAnchor="middle" fill="var(--primary-main)">멈춤 날개</text>
                    <text x="88" y="52" fontSize="4.2" textAnchor="middle" fill="var(--primary-main)">멈춤 날개</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">5</div>
              <div className="step-content">
                <h4>밀면 흔들흔들!</h4>
                <p>손잡이를 좌우로 슬슬 밀어보세요. 슬라이더는 곧게 옆으로 가는데 기둥 위 장식이 좌우로 왔다갔다 흔들립니다. 시계추처럼, 인사하듯, 짝짝이 춤추듯 움직여요!</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="140" viewBox="0 0 100 70" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <circle cx="50" cy="58" r="2.2" fill="var(--text-primary)" />
                    <path d="M50 58 L66 22" stroke="var(--text-primary)" strokeWidth="2.2" />
                    <path d="M50 58 L34 22" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="2 2" />
                    <path d="M66 18 l4 -5 a2.6 2.6 0 0 0 -4 -1 a2.6 2.6 0 0 0 -4 1 z" fill="gold" stroke="orange" strokeWidth="1" />
                    <path d="M34 14 l4 -5 a2.6 2.6 0 0 0 -4 -1 a2.6 2.6 0 0 0 -4 1 z" fill="none" stroke="var(--text-secondary)" strokeWidth="0.8" strokeDasharray="2 1" />
                    <path d="M30 46 q20 8 40 0" fill="none" stroke="var(--primary-main)" strokeWidth="1" strokeDasharray="3 2" />
                    <text x="50" y="68" fontSize="4.5" textAnchor="middle" fill="var(--primary-main)">좌우로 흔들흔들</text>
                  </svg>
                </div>
              </div>
            </div>
          </>
        );

      case 'v-fold':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>삼각형 팝업 조각 오리기</h4>
                <p>검은색 실선을 따라 삼각형 팝업 조각을 오려주세요. 아래 양쪽에 붙은 초록색 날개(풀칠 자리)는 자르지 말고 남깁니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    {/* Symmetric triangular gusset outline (cut) */}
                    <path d="M50 8 L24 44 L76 44 Z" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeDasharray="4 2" />
                    {/* Two glue feet, one per arm, split at the centre line */}
                    <path d="M24 44 L50 44 L50 50 L26 50 Z" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <path d="M50 44 L76 44 L74 50 L50 50 Z" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <path d="M8 52 L18 42 M18 52 L8 42" stroke="var(--primary-main)" strokeWidth="2" /> {/* Scissors hint */}
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>능선은 산접기, 바닥은 골접기</h4>
                <p>가운데 세로선(빨간 점선)은 <b>산접기</b>(볼록하게)로 능선이 앞으로 뾰족하게 서게 하고, 양옆 바닥선(파란 점선)은 <b>골접기</b>(오목하게)로 두 팔이 바깥으로 눕게 접어주세요.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <path d="M50 8 L24 44 L76 44 Z" fill="none" stroke="var(--text-secondary)" strokeWidth="1" />
                    {/* Central ridge = mountain (red) */}
                    <path d="M50 8 L50 44" stroke="red" strokeWidth="2" strokeDasharray="4 2" />
                    {/* Two base creases = valley (blue) */}
                    <path d="M24 44 L50 44" stroke="blue" strokeWidth="2" strokeDasharray="4 1 1 1" />
                    <path d="M50 44 L76 44" stroke="blue" strokeWidth="2" strokeDasharray="4 1 1 1" />
                    <path d="M24 44 L50 44 L50 50 L26 50 Z" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <path d="M50 44 L76 44 L74 50 L50 50 Z" fill="rgba(0,170,0,0.15)" stroke="green" strokeWidth="1" />
                    <text x="58" y="26" fontSize="6" fill="red">산접기(능선)</text>
                    <text x="20" y="57" fontSize="5.5" fill="blue">골접기(바닥)</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>척추 기준 좌우 대칭으로 붙이기</h4>
                <p>카드를 반쯤 펼친 상태에서 왼쪽 팔은 왼쪽 종이면에, 오른쪽 팔은 오른쪽 종이면에 <b>척추를 기준으로 좌우 대칭</b>이 되게 붙이세요. 두 팔의 능선이 척추 위에서 만나고, 열면 능선이 앞으로 솟아오릅니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="160" viewBox="0 0 100 80" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <text x="50" y="8" fontSize="4.2" textAnchor="middle" fill="var(--text-secondary)">카드를 펼쳐서 위에서 내려다본 모습</text>
                    {/* Opened card viewed from directly above, split at the spine
                        into its two separate page halves (NOT one solid shape) so
                        it doesn't read as a single pyramid — left half a touch
                        lighter, right half a touch darker, same convention as the
                        layered-stage diagram's top-down diamond. */}
                    <path d="M10 56 L50 74 L50 12 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <path d="M90 56 L50 74 L50 12 Z" fill="rgba(0,0,0,0.06)" stroke="var(--text-primary)" strokeWidth="1" />
                    <text x="24" y="46" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">왼쪽 페이지</text>
                    <text x="76" y="46" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">오른쪽 페이지</text>
                    <path d="M50 74 L50 12" stroke="var(--text-secondary)" strokeWidth="1.5" strokeDasharray="3 2" />
                    <text x="53" y="18" fontSize="5.5" fontWeight="bold" fill="var(--text-secondary)">척추</text>
                    {/* V-fold: symmetric about the spine, apex rising toward viewer */}
                    <path d="M50 26 L50 50 L34 56 Z" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1" />
                    <path d="M50 26 L50 50 L66 56 Z" fill="var(--primary-main)" stroke="var(--primary-main)" strokeWidth="1" opacity="0.55" />
                    {/* Mountain ridge along the spine, toward the viewer */}
                    <path d="M50 26 L50 50" stroke="red" strokeWidth="1.5" strokeDasharray="3 2" />
                    {/* Glue feet on the two pages */}
                    <path d="M50 50 L34 56" stroke="green" strokeWidth="2" />
                    <path d="M50 50 L66 56" stroke="green" strokeWidth="2" />
                    <circle cx="34" cy="56" r="2" fill="green" />
                    <circle cx="66" cy="56" r="2" fill="green" />
                    <text x="50" y="70" fontSize="4.5" textAnchor="middle" fill="green">양쪽 페이지에 대칭으로 풀칠</text>
                  </svg>
                </div>
              </div>
            </div>
            {element.params?.armExtension && (
              <div className="instruction-step card">
                <div className="step-badge">4</div>
                <div className="step-content">
                  <h4>혀/뿔 확장 조각 이어 붙이기</h4>
                  <p>도안에 함께 있는 길고 좁은 삼각형 조각(혀·뿔처럼 튀어나오는 부분)도 같은 방법(가운데 산접기, 바닥 골접기)으로 접어주세요. 이 조각의 바닥 풀칠 자리는 방금 붙인 삼각형 팝업의 능선 쪽 앞면(꼭짓점 근처)에 이어서 붙입니다 — 두 능선이 일직선으로 이어져야 카드를 열 때 훨씬 더 멀리 튀어나옵니다.</p>
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                    <svg width="200" height="140" viewBox="0 0 100 70" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                      {/* Main mouth wedge, shorter/wider */}
                      <path d="M50 40 L34 62 L66 62 Z" fill="none" stroke="var(--text-secondary)" strokeWidth="1" />
                      <path d="M50 40 L50 62" stroke="red" strokeWidth="1.5" strokeDasharray="3 2" />
                      {/* Extension wedge, longer/narrower, glued at the mouth's apex */}
                      <path d="M50 8 L44 40 L56 40 Z" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1.5" strokeDasharray="4 2" />
                      <path d="M50 8 L50 40" stroke="red" strokeWidth="1.5" strokeDasharray="3 2" />
                      <path d="M44 40 L56 40" stroke="green" strokeWidth="2" />
                      <text x="66" y="38" fontSize="4.5" fill="green">여기에 풀칠</text>
                      <text x="50" y="6" fontSize="4.2" textAnchor="middle" fill="var(--primary-main)">혀/뿔 확장부</text>
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </>
        );

      case 'flap-clap':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>오리기</h4>
                <p>검은색 실선을 따라 위/아래 삼각형 플랩 2개와 지지대(프롭) 막대 2개를 오려주세요. 플랩의 밑변(가로선)은 자르지 마세요 — 그 선이 접는 선입니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="120" viewBox="0 0 100 60" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <path d="M30 45 L50 15 L70 45 Z" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
                    <path d="M30 45 L70 45" stroke="var(--primary-main)" strokeWidth="2" strokeDasharray="4 2" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>세우고 지지대 붙이기</h4>
                <p>밑변(빨간 점선)을 산접기해서 플랩을 세운 뒤, 지지대 막대 한쪽 끝(①)은 플랩 가운데에, 다른 쪽 끝(②)은 척추 쪽 종이면에 팽팽하게 당겨 붙이세요. 이 지지대가 플랩이 서는 각도를 고정합니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="150" height="100" viewBox="0 0 80 50" style={{ width: '55%', maxWidth: '200px', height: 'auto' }}>
                    <path d="M10 45 L40 45 L55 15" fill="none" stroke="var(--text-primary)" strokeWidth="2" />
                    <path d="M45 30 L20 45" stroke="var(--primary-main)" strokeWidth="2" />
                    <text x="45" y="26" fontSize="6" fill="var(--text-primary)">①</text>
                    <text x="18" y="49" fontSize="6" fill="var(--text-primary)">②</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>장식 붙이고 확인하기</h4>
                <p>지느러미(또는 손) 장식을 오려 각 플랩 앞면에 붙이세요. 카드를 천천히 여닫으면 도안에 적힌 "탁! 각도" 근처에서 위아래 플랩이 서로 마주 부딪힙니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="140" viewBox="0 0 100 70" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <path d="M20 35 L50 10 L80 35" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M20 35 L50 60 L80 35" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M45 32 L50 25 L55 32" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1" />
                    <path d="M45 38 L50 45 L55 38" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        );

      case 'gate-curtain':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>오리기</h4>
                <p>검은 실선을 따라 오려주세요: 게이트 카드 1장(가운데 뒷판 + 좌·우 문), 노란 커튼 2장, 장식 액자 1장(가운데 다이아몬드 창도 오려냄), 지지대(스트랩) 2개, 문 돌 장식 2개.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="220" height="120" viewBox="0 0 110 60" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    {/* Unfolded gate card: panel + two doors, two vertical valley hinges */}
                    <rect x="8" y="8" width="60" height="34" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M23 8 L23 42 M53 8 L53 42" stroke="blue" strokeWidth="1.5" strokeDasharray="4 1 1 1" />
                    <text x="38" y="50" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">게이트 카드 (세로 골접기 2개)</text>
                    {/* Bowtie curtain */}
                    <path d="M78 10 L96 10 L96 28 L78 28 L86 19 Z" fill="var(--primary-light)" stroke="var(--text-primary)" strokeWidth="1" />
                    <text x="87" y="35" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">커튼 ×2</text>
                    {/* Frame with diamond */}
                    <rect x="76" y="40" width="22" height="16" rx="2" fill="none" stroke="var(--text-primary)" strokeWidth="1" />
                    <path d="M87 43 L93 48 L87 53 L81 48 Z" fill="none" stroke="var(--text-primary)" strokeWidth="1" />
                    <text x="87" y="59" fontSize="4" textAnchor="middle" fill="var(--text-secondary)">액자</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>문 접기</h4>
                <p>좌·우 문을 파란 세로 점선(골접기)으로 안쪽으로 접었다 펴서 경첩을 만들어 주세요. 두 문을 닫으면 자유단이 가운데서 딱 맞닿습니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="110" viewBox="0 0 100 55" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <text x="50" y="7" fontSize="4.2" textAnchor="middle" fill="var(--text-secondary)">위에서 내려다본 모습</text>
                    <path d="M25 40 L75 40" stroke="var(--text-primary)" strokeWidth="2" /> {/* panel */}
                    <path d="M25 40 L38 18" stroke="var(--primary-main)" strokeWidth="2" /> {/* left door */}
                    <path d="M75 40 L62 18" stroke="var(--primary-main)" strokeWidth="2" /> {/* right door */}
                    <path d="M38 18 Q50 10 62 18" fill="none" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="2 2" />
                    <text x="50" y="50" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">뒷판은 고정, 두 문이 안쪽으로 접혀 닫힘</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>주인공 붙이고 커튼 올리기</h4>
                <p>① 주인공 그림을 뒷판 가운데(표시된 자리)에 얇게 붙입니다. ④ 커튼 2장을 그 위에 좌·우에서 겹쳐 놓으세요(가운데서 살짝 겹쳐 주인공을 가림). 커튼은 뒷판에 절대 붙이지 마세요 — 미끄러져야 합니다!</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="110" viewBox="0 0 100 55" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <rect x="20" y="8" width="60" height="40" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <circle cx="50" cy="28" r="8" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1" />
                    <path d="M24 12 L52 12 L52 44 L24 44 L36 28 Z" fill="gold" fillOpacity="0.55" stroke="orange" strokeWidth="1" />
                    <path d="M76 12 L48 12 L48 44 L76 44 L64 28 Z" fill="gold" fillOpacity="0.55" stroke="orange" strokeWidth="1" />
                    <text x="50" y="53" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">커튼 두 장이 가운데서 겹쳐 주인공을 가림</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">4</div>
              <div className="step-content">
                <h4>액자 덮기 — 위·아래만 풀칠!</h4>
                <p>③ 장식 액자를 커튼 위에 덮고 위·아래 변(초록)만 뒷판에 붙입니다. 좌·우는 절대 붙이지 마세요 — 그래야 커튼이 액자 밑 좌우로 빠져나갑니다. 액자가 커튼을 눌러 납작하게 잡아 줍니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="110" viewBox="0 0 100 55" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <rect x="28" y="8" width="44" height="40" rx="3" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <path d="M50 16 L62 28 L50 40 L38 28 Z" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" />
                    <rect x="30" y="9" width="40" height="5" fill="rgba(0,170,0,0.3)" stroke="green" strokeWidth="0.7" strokeDasharray="1 2" />
                    <rect x="30" y="42" width="40" height="5" fill="rgba(0,170,0,0.3)" stroke="green" strokeWidth="0.7" strokeDasharray="1 2" />
                    <path d="M24 28 L14 28 M76 28 L86 28" stroke="orange" strokeWidth="2" />
                    <text x="50" y="53" fontSize="4.5" textAnchor="middle" fill="green">위·아래만 풀칠 — 좌·우는 커튼 길</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">5</div>
              <div className="step-content">
                <h4>가장 중요 — 지지대 붙이기</h4>
                <p>② 스트랩 한끝을 문 안쪽 Ⓡ/Ⓛ 자리(경첩에서 조금 안쪽)에, 다른 끝을 같은 쪽 커튼 바깥 끝에 붙입니다. 두 접힘선이 반드시 문 경첩(세로선)과 나란해야 합니다. 오른쪽·왼쪽 모두 대칭으로!</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="200" height="110" viewBox="0 0 100 55" style={{ width: '100%', maxWidth: '300px', height: 'auto' }}>
                    <text x="50" y="7" fontSize="4.2" textAnchor="middle" fill="var(--text-secondary)">위에서 내려다본 모습 (오른쪽 문)</text>
                    <path d="M15 40 L70 40" stroke="var(--text-primary)" strokeWidth="2" /> {/* panel */}
                    <path d="M70 40 L58 20" stroke="var(--primary-main)" strokeWidth="2" /> {/* door ajar */}
                    <circle cx="62" cy="27" r="1.6" fill="var(--primary-main)" />
                    <path d="M62 27 L40 40" stroke="green" strokeWidth="2" /> {/* strap */}
                    <circle cx="40" cy="40" r="1.6" fill="green" />
                    <text x="66" y="24" fontSize="4.5" fill="var(--text-primary)">문 피벗</text>
                    <text x="38" y="47" fontSize="4.5" fill="green">커튼 끝</text>
                    <path d="M40 36 L28 36" stroke="orange" strokeWidth="1.5" markerEnd="none" />
                    <text x="33" y="33" fontSize="4.5" textAnchor="middle" fill="orange">커튼이 끌려감</text>
                  </svg>
                </div>
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">6</div>
              <div className="step-content">
                <h4>돌 장식 붙이고 열어보기!</h4>
                <p>문 바깥면에 돌 장식을 붙이면 완성. 두 문을 함께 열면 커튼이 좌우로 걷히며 주인공 둘레에 노란 다이아몬드가 열리고, 닫으면 커튼이 저절로 다시 모여 주인공을 덮습니다.</p>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg width="220" height="120" viewBox="0 0 110 60" style={{ width: '100%', maxWidth: '320px', height: 'auto' }}>
                    <rect x="5" y="12" width="24" height="36" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" /> {/* left door open */}
                    <rect x="81" y="12" width="24" height="36" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1.5" /> {/* right door open */}
                    <rect x="29" y="12" width="52" height="36" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" /> {/* panel */}
                    <path d="M55 16 L72 30 L55 44 L38 30 Z" fill="gold" fillOpacity="0.6" stroke="orange" strokeWidth="1" /> {/* yellow diamond */}
                    <circle cx="55" cy="30" r="7" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1" /> {/* character */}
                    <text x="55" y="56" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">문을 열면 커튼이 걷히고 주인공 등장!</text>
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
                    <text x="50" y="8" fontSize="4.2" textAnchor="middle" fill="var(--text-secondary)">카드를 펼쳐서 위에서 내려다본 모습</text>
                    {/* Opened card viewed from directly above, split at the
                        spine into its two actual page halves (not one solid
                        outline) — same convention as the v-fold / layered-stage
                        diagrams, so this reads as "two hinged pages", not a
                        single pyramid. */}
                    <path d="M10 56 L50 74 L50 12 Z" fill="var(--bg-glass)" stroke="var(--text-primary)" strokeWidth="1" />
                    <path d="M90 56 L50 74 L50 12 Z" fill="rgba(0,0,0,0.06)" stroke="var(--text-primary)" strokeWidth="1" />
                    <text x="24" y="46" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">왼쪽 페이지</text>
                    <text x="76" y="46" fontSize="4.5" textAnchor="middle" fill="var(--text-secondary)">오른쪽 페이지</text>
                    <path d="M50 74 L50 12" stroke="var(--text-secondary)" strokeWidth="1.5" strokeDasharray="3 2" />
                    <text x="53" y="18" fontSize="5.5" fontWeight="bold" fill="var(--text-secondary)">척추</text>
                    {/* Pop-up mechanism abstract — deliberately generic (this
                        step covers box-popup, parallel-fold and pull-tab,
                        which don't share one shape), but anchored to the
                        spine with the same left/right glue-foot markers used
                        elsewhere so at least the attachment is unambiguous. */}
                    <path d="M50 32 L50 52 L34 58 L34 38 Z" fill="var(--primary-light)" stroke="var(--primary-main)" strokeWidth="1" />
                    <path d="M50 32 L50 52 L66 58 L66 38 Z" fill="var(--primary-main)" stroke="var(--primary-main)" strokeWidth="1" opacity="0.55" />
                    <path d="M50 52 L34 58" stroke="green" strokeWidth="2" />
                    <path d="M50 52 L66 58" stroke="green" strokeWidth="2" />
                    <circle cx="34" cy="58" r="2" fill="green" />
                    <circle cx="66" cy="58" r="2" fill="green" />
                    <text x="50" y="70" fontSize="4.5" textAnchor="middle" fill="green">양쪽 페이지에 대칭으로 풀칠</text>
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
        {elements.map((element, i) => (
          <React.Fragment key={element.id || i}>
            {elements.length > 1 && (
              <h4 style={{ margin: 'var(--space-md) 0 0' }}>
                {CIRCLED_NUMBERS[i] || i + 1} {getMechanism(element.mechanism)?.labelKo || element.mechanism}
              </h4>
            )}
            {renderSteps(element)}
          </React.Fragment>
        ))}
        {elements.length > 1 && (
          <p style={{ color: 'var(--text-secondary)' }}>
            여러 부품을 조합할 때는 2D 도안의 마지막 페이지(조립 배치도)에 표시된 위치에 각 번호 부품을 붙이세요.
          </p>
        )}
      </div>
    </div>
  );
}
